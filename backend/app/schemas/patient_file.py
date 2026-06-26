from pydantic import BaseModel
from datetime import datetime


class PatientFileOut(BaseModel):
    id: int
    patient_id: int
    filename: str
    content_type: str | None
    size: int
    created_at: datetime

    model_config = {"from_attributes": True}
