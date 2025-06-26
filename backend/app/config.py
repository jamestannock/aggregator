import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gpt-4o-mini")
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", 0))
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", 10000))
    AWS_REGION: str = os.getenv("AWS_REGION")
    UPLOAD_BUCKET: str = os.getenv("UPLOAD_BUCKET")

@lru_cache
def get_settings() -> Settings:
    return Settings()