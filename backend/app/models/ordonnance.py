from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class OrdonnanceType(str, enum.Enum):
    medicale = "medicale"
    lunettes = "lunettes"
    lentilles = "lentilles"


class Ordonnance(Base):
    """A prescription attached to a patient.

    Three kinds, stored in the same table (`type` is a plain string so new
    kinds don't need a Postgres enum migration):
      - medicale : `medicaments` = [{ medicament, posologie, duree, instructions }]
      - lunettes : `verres` = {
            type_correction, ecart_pupillaire,
            od: { sphere, cylindre, axe, addition },
            og: { sphere, cylindre, axe, addition }
        }
      - lentilles : `lentilles` = {
            type_lentille, rythme_port, produit_entretien,
            od: { puissance, rayon, diametre },
            og: { puissance, rayon, diametre }
        }
    """

    __tablename__ = "ordonnances"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    medecin_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    type = Column(String, nullable=False)  # medicale | lunettes | lentilles
    date_ordonnance = Column(Date, nullable=False)

    medicaments = Column(JSON, nullable=True, default=list)
    verres = Column(JSON, nullable=True, default=dict)
    lentilles = Column(JSON, nullable=True, default=dict)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient")
    medecin = relationship("User", foreign_keys=[medecin_id])
