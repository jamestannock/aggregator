from openai import OpenAI
import pdfplumber
from app.config import get_settings

# Load settings including API key
settings = get_settings()
client = OpenAI(api_key=settings.OPENAI_API_KEY)

def extract_text(pdf_path: str) -> str:
    """Read every page of a PDF into one string."""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def ask_openai(company: str, legislation_text: str) -> list[str]:
    """Call OpenAI to extract obligations as bullet points."""
    system_prompt = (
        "You are a senior compliance analyst. "
        "Given legislation text, list every explicit obligation the company must follow. "
        "Respond with one line per obligation, no extra headings."
    )
    user_prompt = (
        f"Company: {company}\n\n"
        f"Legislation:\n{legislation_text[:12000]}"
    )

    resp = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=settings.TEMPERATURE,
        max_tokens=settings.MAX_TOKENS,
    )

    raw = resp.choices[0].message.content.strip()
    return [
        line.lstrip("–-• ").strip()
        for line in raw.splitlines()
        if line.strip()
    ]

def extract_relevant_legislation(
    company_name: str,
    company_info: str,
    location: str
) -> list[str]:
    """Call OpenAI to list relevant legislation/regulations/standards/acts."""
    system_prompt = (
        "You are a senior compliance analyst. "
        "Given a company's name, information, and location, list the relevant "
        "legislation, regulations, standards, and acts that may impose obligations "
        "on the company. Respond with one item per line, no extra headings."
    )
    user_prompt = (
        f"Company: {company_name}\n"
        f"Information: {company_info}\n"
        f"Country: {location}"
    )

    resp = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=settings.TEMPERATURE,
        max_tokens=settings.MAX_TOKENS,
    )

    raw = resp.choices[0].message.content.strip()
    return [
        line.lstrip("–-• ").strip()
        for line in raw.splitlines()
        if line.strip()
    ]