import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()  # reads .env at project root

class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    MODEL_NAME: str = "gpt-4o-mini"
    TEMPERATURE: float = 0
    MAX_TOKENS: int = 2048

@lru_cache
def get_settings() -> Settings:
    return Settings()
