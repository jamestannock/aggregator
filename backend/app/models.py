from pydantic import BaseModel
from typing import List

class ExtractRequest(BaseModel):
    company: str

class ObligationResponse(BaseModel):
    obligations: List[str]
