from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from ..services.obligations import extract_text, ask_openai
from ..models import ObligationResponse
import shutil, os, uuid

router = APIRouter(prefix="/api")

@router.post("/extract", response_model=ObligationResponse)
async def extract_obligations(
        company: str = Form(...),
        pdf: UploadFile = File(...),
    ):
    # store upload to temp location
    tmp_name = f"{uuid.uuid4()}_{pdf.filename}"
    tmp_path = os.path.join("uploads", tmp_name)
    os.makedirs("uploads", exist_ok=True)
    with open(tmp_path, "wb") as buff:
        shutil.copyfileobj(pdf.file, buff)

    try:
        text = extract_text(tmp_path)
        if not text.strip():
            raise HTTPException(status_code=400, detail="PDF text is empty.")
        obligations = ask_openai(company, text)
        return JSONResponse({"obligations": obligations})
    finally:
        os.remove(tmp_path)
