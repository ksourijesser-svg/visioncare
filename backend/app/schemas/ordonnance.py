from pydantic import BaseModel
from datetime import date, datetime
from app.models.ordonnance import OrdonnanceType
from app.schemas.patient import PatientOut


class Medicament(BaseModel):
    medicament: str
    categorie: str = ""      # type de médicament (antibiotique collyre, corticoïde per os, …)
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


class OeilLentille(BaseModel):
    puissance: str = ""
    rayon: str = ""       # rayon de courbure (mm)
    diametre: str = ""    # diamètre (mm)


class Lentilles(BaseModel):
    type_lentille: str = ""    # souple | rigide
    rythme_port: str = ""      # journalier | hebdomadaire | mensuel | trimestriel | annuel
    produit_entretien: str = ""
    od: OeilLentille = OeilLentille()
    og: OeilLentille = OeilLentille()


class OrdonnanceCreate(BaseModel):
    patient_id: int
    type: OrdonnanceType
    date_ordonnance: date | None = None
    medicaments: list[Medicament] = []
    verres: Verres | None = None
    lentilles: Lentilles | None = None
    notes: str | None = None


class OrdonnanceOut(BaseModel):
    id: int
    patient_id: int
    medecin_id: int
    type: OrdonnanceType
    date_ordonnance: date
    medicaments: list[Medicament] | None
    verres: Verres | None
    lentilles: Lentilles | None
    notes: str | None
    patient: PatientOut
    created_at: datetime

    model_config = {"from_attributes": True}
