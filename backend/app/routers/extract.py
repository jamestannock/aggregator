# backend/app/routers/extract.py

import os
import io
import uuid
import json
import logging
import boto3
from botocore.exceptions import ClientError
import shutil

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    Query,
    HTTPException,
    status,
)
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.services.obligations import extract_text, ask_openai, extract_relevant_legislation
from app.models import ObligationResponse


# Load settings and configure logger
settings = get_settings()
logger = logging.getLogger("uvicorn.error")

# Initialize S3 client
s3 = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)
BUCKET = settings.UPLOAD_BUCKET

# Single router for all endpoints
router = APIRouter(prefix="/api", tags=["extract", "s3", "output"])

@router.post(
    "/extract",
    response_model=ObligationResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract obligations from an uploaded PDF",
)
async def extract_local(
    company: str = Form(...),
    pdf: UploadFile = File(...),
):
    """
    Upload a PDF, save temporarily on disk, extract text and run the OpenAI model.
    """
    tmp_dir = "uploads"
    os.makedirs(tmp_dir, exist_ok=True)
    tmp_path = os.path.join(tmp_dir, f"{uuid.uuid4()}_{pdf.filename}")

    with open(tmp_path, "wb") as buff:
        shutil.copyfileobj(pdf.file, buff)

    try:
        text = extract_text(tmp_path)
        if not text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF text is empty."
            )
        obligations = ask_openai(company, text)
        return JSONResponse({"obligations": obligations})
    finally:
        try:
            os.remove(tmp_path)
        except OSError as e:
            logger.warning(f"Failed to delete temp file {tmp_path}: {e}")

@router.post(
    "/upload-pdf",
    status_code=status.HTTP_201_CREATED,
    summary="Upload PDF to S3",
)
async def upload_pdf_to_s3(
    pdf: UploadFile = File(...)
):
    """
    Upload the incoming PDF to S3 under the 'raw/' prefix and return its key.
    """
    key = f"raw/{uuid.uuid4()}_{pdf.filename}"
    body = await pdf.read()
    try:
        s3.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=body,
            ContentType=pdf.content_type,
        )
    except Exception as e:
        logger.exception("S3 upload failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"S3 upload failed: {e}"
        )
    return {"key": key}

@router.get(
    "/pdf-url",
    summary="Generate a presigned URL for a PDF",
)
def get_pdf_url(
    key: str = Query(..., description="S3 object key")
):
    """
    Create a short-lived presigned URL for downloading the PDF.
    """
    try:
        url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": BUCKET, "Key": key},
            ExpiresIn=3600,
        )
    except Exception as e:
        logger.exception("Presign failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Presign failed: {e}"
        )
    return {"url": url}

@router.get(
    "/list-pdfs",
    summary="List all PDFs in S3 under 'raw/'",
)
def list_pdfs():
    """
    Return a list of all S3 keys under the 'raw/' prefix.
    """
    try:
        resp = s3.list_objects_v2(Bucket=BUCKET, Prefix="raw/")
        keys = [o["Key"] for o in resp.get("Contents", [])]
        return {"keys": keys}
    except Exception as e:
        logger.exception("Listing PDFs failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Listing failed: {e}"
        )

@router.delete(
    "/pdf",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a PDF from S3",
)
def delete_pdf(
    key: str = Query(..., description="S3 object key to delete")
):
    """
    Delete the specified PDF from S3.
    """
    try:
        s3.delete_object(Bucket=BUCKET, Key=key)
    except Exception as e:
        logger.exception("Delete PDF failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete failed: {e}"
        )
    return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)

@router.post(
    "/extract-s3",
    response_model=ObligationResponse,
    summary="Extract obligations from a PDF stored in S3 and persist output",
)
async def extract_from_s3(
    company: str = Form(...),
    key: str = Form(...),
):
    """
    1) Fetch the PDF from S3
    2) Extract text and run OpenAI
    3) Persist the result JSON to S3 under 'output/'
    4) Return obligations
    """
    # derive output key based on filename
    base = key.rsplit("/", 1)[1].rsplit(".", 1)[0]
    output_key = f"output/{base}.json"

    # fetch PDF bytes
    try:
        obj = s3.get_object(Bucket=BUCKET, Key=key)
        body = obj["Body"].read()
    except Exception as e:
        logger.exception("Failed to fetch PDF from S3")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"S3 get failed: {e}"
        )

    # extract text and call OpenAI
    text = extract_text(io.BytesIO(body))
    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF text is empty."
        )
    obligations = ask_openai(company, text)

    # persist JSON to S3
    try:
        s3.put_object(
            Bucket=BUCKET,
            Key=output_key,
            Body=json.dumps(obligations),
            ContentType="application/json"
        )
    except Exception:
        logger.exception("Failed to write output to S3")
        # continue, we still return the obligations below

    return JSONResponse({"obligations": obligations})

@router.get(
    "/output",
    summary="Fetch persisted obligations for a given PDF",
    response_model=ObligationResponse,
)
def get_output(
    pdfKey: str = Query(..., description="raw/... key")
):
    """
    Load JSON from S3 under 'output/<base>.json'. If missing, returns empty list.
    """
    base = pdfKey.rsplit("/", 1)[1].rsplit(".", 1)[0]
    output_key = f"output/{base}.json"
    try:
        obj = s3.get_object(Bucket=BUCKET, Key=output_key)
        data = json.loads(obj["Body"].read())
        return {"obligations": data}
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code")
        if code in ("NoSuchKey", "404"):
            return {"obligations": []}
        logger.exception("Error fetching persisted output")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not load output: {e}"
        )

@router.post(
    "/discover",
    summary="Persist company info + country to S3 and extract relevant legislation",
)
async def discover_company_info(
    companyName: str = Form(...),
    companyInfo: str = Form(...),
    location: str = Form(...),
):
    """
    Save the submitted company details to S3 as JSON, then ask OpenAI
    to list relevant legislation/standards/acts.
    """
    filename = f"{uuid.uuid4()}_{companyName.replace(' ', '_')}.json"
    key = f"company_info/{filename}"
    payload = {
        "companyName": companyName,
        "companyInfo": companyInfo,
        "location": location,
    }

    # persist the raw details
    try:
        s3.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=json.dumps(payload),
            ContentType="application/json"
        )
    except Exception as e:
        logger.exception("Failed to write company_info to S3")
        raise HTTPException(
            status_code=500,
            detail=f"Could not save to S3: {e}"
        )

    # now call OpenAI to get the list of applicable laws/acts
    try:
        regulations = extract_relevant_legislation(
            company_name=companyName,
            company_info=companyInfo,
            location=location
        )
    except Exception as e:
        logger.exception("OpenAI legislation extraction failed")
        # decide whether to bubble up or return empty list:
        regulations = []

    return JSONResponse({"key": key, "regulations": regulations})