from pydantic import BaseModel
from datetime import date, datetime
from app.models.facture import FactureStatus, PaymentMethod
from app.schemas.patient import PatientOut


class LigneFacture(BaseModel):
    designation: str
    quantite: float = 1
    prix_unitaire: float = 0


class FactureCreate(BaseModel):
    patient_id: int
    date_emission: date | None = None
    date_echeance: date | None = None
    lignes: list[LigneFacture] = []
    notes: str | None = None


class FactureUpdate(BaseModel):
    date_emission: date | None = None
    date_echeance: date | None = None
    lignes: list[LigneFacture] | None = None
    statut: FactureStatus | None = None
    notes: str | None = None


class PaiementCreate(BaseModel):
    montant: float
    methode_paiement: PaymentMethod
    date_paiement: date | None = None


class FactureOut(BaseModel):
    id: int
    numero: str
    patient_id: int
    medecin_id: int
    date_emission: date
    date_echeance: date | None
    lignes: list[LigneFacture]
    montant_total: float
    montant_paye: float
    statut: FactureStatus
    methode_paiement: PaymentMethod | None
    date_paiement: date | None
    notes: str | None
    patient: PatientOut
    created_at: datetime

    model_config = {"from_attributes": True}
