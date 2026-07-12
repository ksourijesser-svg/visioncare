from pydantic import BaseModel, EmailStr
from datetime import date, datetime


class PatientCreate(BaseModel):
    nom: str
    prenom: str
    date_naissance: date | None = None
    telephone: str | None = None
    email: EmailStr | None = None
    adresse: str | None = None
    numero_securite_sociale: str | None = None
    notes: str | None = None
    antecedents_generaux: str | None = None
    antecedents_ophtalmologiques: str | None = None
    prise_en_charge: str | None = None


class PatientUpdate(PatientCreate):
    nom: str | None = None
    prenom: str | None = None


class PatientOut(BaseModel):
    id: int
    nom: str
    prenom: str
    date_naissance: date | None
    telephone: str | None
    email: str | None
    adresse: str | None
    notes: str | None
    antecedents_generaux: str | None
    antecedents_ophtalmologiques: str | None
    prise_en_charge: str | None
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}
