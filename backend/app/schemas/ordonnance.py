from pydantic import BaseModel
from datetime import date, datetime
from app.models.ordonnance import OrdonnanceType
from app.schemas.patient import PatientOut


class Medicament(BaseModel):
    medicament: str
    posologie: str = ""
    duree: str = ""
    instructions: str = ""


class OeilVerre(BaseModel):
    sphere: str = ""
    cylindre: str = ""
    axe: str = ""
    addition: str = ""


class Verres(BaseModel):
    type_correction: str = ""        # loin | pres | progressif
    ecart_pupillaire: str = ""
    od: OeilVerre = OeilVerre()
    og: OeilVerre = OeilVerre()


class OrdonnanceCreate(BaseModel):
    patient_id: int
    type: OrdonnanceType
    date_ordonnance: date | None = None
    medicaments: list[Medicament] = []
    verres: Verres | None = None
    notes: str | None = None


class OrdonnanceOut(BaseModel):
    id: int
    patient_id: int
    medecin_id: int
    type: OrdonnanceType
    date_ordonnance: date
    medicaments: list[Medicament] | None
    verres: Verres | None
    notes: str | None
    patient: PatientOut
    created_at: datetime

    model_config = {"from_attributes": True}
