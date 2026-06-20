from pydantic import BaseModel
from datetime import datetime
from app.models.appointment import AppointmentStatus
from app.schemas.patient import PatientOut


class AppointmentCreate(BaseModel):
    patient_id: int
    date_heure: datetime
    duree: int = 30
    motif: str | None = None
    notes: str | None = None


class AppointmentUpdate(BaseModel):
    date_heure: datetime | None = None
    duree: int | None = None
    motif: str | None = None
    notes: str | None = None
    statut: AppointmentStatus | None = None
    diagnostic: str | None = None
    traitement: str | None = None


class AppointmentStatusUpdate(BaseModel):
    statut: AppointmentStatus


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    medecin_id: int
    date_heure: datetime
    duree: int
    statut: AppointmentStatus
    motif: str | None
    notes: str | None
    diagnostic: str | None
    traitement: str | None
    patient: PatientOut
    created_at: datetime

    model_config = {"from_attributes": True}
