# backend/app/services/obligations.py

from openai import OpenAI
import pdfplumber
from app.config import get_settings

# Load settings and initialize OpenAI client
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
        f"Legislation:\n{legislation_text[:12000]}"  # truncate to stay within token limits
    )
    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=settings.TEMPERATURE,
        max_tokens=settings.MAX_TOKENS
    )
    raw = response.choices[0].message.content.strip()
    return [line.lstrip("–-• ").strip() for line in raw.splitlines() if line.strip()]
