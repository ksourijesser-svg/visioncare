from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class PatientFile(Base):
    """A document or image attached to a patient's dossier.

    Files are stored as bytes directly in PostgreSQL — Railway's filesystem is
    ephemeral, so disk storage would not survive a redeploy.
    """

    __tablename__ = "patient_files"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    medecin_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=True)
    size = Column(Integer, nullable=False, default=0)
    data = Column(LargeBinary, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient")
    medecin = relationship("User", foreign_keys=[medecin_id])
