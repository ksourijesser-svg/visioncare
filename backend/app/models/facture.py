from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey, Numeric, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class FactureStatus(str, enum.Enum):
    impayee = "impayee"
    partielle = "partielle"
    payee = "payee"
    annulee = "annulee"


class PaymentMethod(str, enum.Enum):
    espece = "espece"
    carte = "carte"
    cheque = "cheque"
    virement = "virement"


class Facture(Base):
    __tablename__ = "factures"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String, nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    medecin_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    date_emission = Column(Date, nullable=False)
    date_echeance = Column(Date, nullable=True)

    # [{ "designation": str, "quantite": float, "prix_unitaire": float }]
    lignes = Column(JSON, nullable=False, default=list)

    montant_total = Column(Numeric(10, 2), nullable=False, default=0)
    montant_paye = Column(Numeric(10, 2), nullable=False, default=0)

    statut = Column(Enum(FactureStatus), default=FactureStatus.impayee, nullable=False)
    methode_paiement = Column(Enum(PaymentMethod), nullable=True)
    date_paiement = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient")
    medecin = relationship("User", foreign_keys=[medecin_id])
