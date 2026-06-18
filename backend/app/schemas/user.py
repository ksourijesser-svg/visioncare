from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nom: str
    prenom: str
    role: UserRole = UserRole.secretaire
    telephone: str | None = None
    cabinet: str | None = None


class UserUpdate(BaseModel):
    nom: str | None = None
    prenom: str | None = None
    telephone: str | None = None
    cabinet: str | None = None


class UserOut(BaseModel):
    id: int
    email: str
    nom: str
    prenom: str
    role: UserRole
    telephone: str | None
    cabinet: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str
