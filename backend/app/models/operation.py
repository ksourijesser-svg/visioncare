from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class OperationStatus(str, enum.Enum):
    planifiee = "planifiee"
    confirmee = "confirmee"
    terminee = "terminee"
    annulee = "annulee"


class Operation(Base):
    """A scheduled surgery / intervention for the doctor's operating calendar."""

    __tablename__ = "operations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    medecin_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    date_operation = Column(DateTime(timezone=True), nullable=False, index=True)
    duree = Column(Integer, default=60)  # minutes

    type_intervention = Column(String, nullable=False)
    oeil = Column(String, nullable=True)        # droit | gauche | deux
    anesthesie = Column(String, nullable=True)  # topique | locale | generale
    salle = Column(String, nullable=True)

    statut = Column(Enum(OperationStatus), default=OperationStatus.planifiee, nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient")
    medecin = relationship("User", foreign_keys=[medecin_id])
