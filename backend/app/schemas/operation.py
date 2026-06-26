from pydantic import BaseModel
from datetime import datetime
from app.models.operation import OperationStatus
from app.schemas.patient import PatientOut


class OperationCreate(BaseModel):
    patient_id: int
    date_operation: datetime
    duree: int = 60
    type_intervention: str
    oeil: str | None = None
    anesthesie: str | None = None
    salle: str | None = None
    statut: OperationStatus = OperationStatus.planifiee
    notes: str | None = None


class OperationUpdate(BaseModel):
    patient_id: int | None = None
    date_operation: datetime | None = None
    duree: int | None = None
    type_intervention: str | None = None
    oeil: str | None = None
    anesthesie: str | None = None
    salle: str | None = None
    statut: OperationStatus | None = None
    notes: str | None = None


class OperationOut(BaseModel):
    id: int
    patient_id: int
    medecin_id: int
    date_operation: datetime
    duree: int
    type_intervention: str
    oeil: str | None
    anesthesie: str | None
    salle: str | None
    statut: OperationStatus
    notes: str | None
    patient: PatientOut
    created_at: datetime

    model_config = {"from_attributes": True}
