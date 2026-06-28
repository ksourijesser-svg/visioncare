from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class UserRole(str, enum.Enum):
    medecin = "medecin"
    secretaire = "secretaire"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    nom = Column(String, nullable=False)
    prenom = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.secretaire, nullable=False)
    telephone = Column(String, nullable=True)
    cabinet = Column(String, nullable=True)
    specialisation = Column(String, nullable=True)
    type_cabinet = Column(String, nullable=True)
    adresse = Column(String, nullable=True)        # cabinet address — shown on public booking map
    photo = Column(Text, nullable=True)            # base64 data URL — doctor profile photo
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
