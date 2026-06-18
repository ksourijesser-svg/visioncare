from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class AppointmentStatus(str, enum.Enum):
    programme = "programme"
    confirme = "confirme"
    complete = "complete"
    annule = "annule"


class Appointment(Base):
    __tablename__ = "rendez_vous"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    medecin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date_heure = Column(DateTime(timezone=True), nullable=False, index=True)
    duree = Column(Integer, default=30)
    statut = Column(Enum(AppointmentStatus), default=AppointmentStatus.programme, nullable=False)
    motif = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="rendez_vous")
    medecin = relationship("User", foreign_keys=[medecin_id])


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    medecin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    diagnostic = Column(Text, nullable=True)
    traitement = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    ordonnance = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="consultations")
    medecin = relationship("User", foreign_keys=[medecin_id])
