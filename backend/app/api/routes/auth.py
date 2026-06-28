import random
import threading
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.email import send_code_email
from app.core.security import create_access_token, decode_token, hash_password, verify_password
from app.db.base import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/auth", tags=["Authentification"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# ── In-memory OTP store ────────────────────────────────────────────────────────
# {email: {code, expires, type, verified}}
_otp_lock = threading.Lock()
_otp_store: dict[str, dict] = {}


def _generate_code() -> str:
    return str(random.randint(100000, 999999))


# ── Schemas ────────────────────────────────────────────────────────────────────
class SendCodeBody(BaseModel):
    email: EmailStr
    type: str  # "signup" | "reset"


class VerifyCodeBody(BaseModel):
    email: EmailStr
    code: str
    type: str


class ResetPasswordBody(BaseModel):
    email: EmailStr
    code: str
    new_password: str


# ── Auth helpers ───────────────────────────────────────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    return user


# ── Standard routes ────────────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants incorrects")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        nom=data.nom,
        prenom=data.prenom,
        role=data.role,
        telephone=data.telephone,
        cabinet=data.cabinet,
        specialisation=data.specialisation,
        type_cabinet=data.type_cabinet,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ── OTP routes ─────────────────────────────────────────────────────────────────
@router.post("/send-code")
def send_code(body: SendCodeBody, db: Session = Depends(get_db)):
    if body.type not in ("signup", "reset"):
        raise HTTPException(status_code=400, detail="Type invalide")

    if body.type == "signup":
        if db.query(User).filter(User.email == body.email).first():
            raise HTTPException(status_code=400, detail="Email déjà utilisé")

    if body.type == "reset":
        # Don't reveal whether email exists — just silently succeed
        if not db.query(User).filter(User.email == body.email).first():
            return {"message": "Si cet email existe, un code a été envoyé."}

    code = _generate_code()
    with _otp_lock:
        _otp_store[body.email] = {
            "code": code,
            "expires": datetime.utcnow() + timedelta(minutes=10),
            "type": body.type,
            "verified": False,
        }

    try:
        send_code_email(body.email, code, body.type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'envoi de l'email : {e}")

    return {"message": "Code envoyé"}


@router.post("/verify-code")
def verify_code(body: VerifyCodeBody):
    with _otp_lock:
        entry = _otp_store.get(body.email)

    if not entry or entry["type"] != body.type:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré")
    if datetime.utcnow() > entry["expires"]:
        with _otp_lock:
            _otp_store.pop(body.email, None)
        raise HTTPException(status_code=400, detail="Code expiré. Veuillez en demander un nouveau.")
    if entry["code"] != body.code:
        raise HTTPException(status_code=400, detail="Code incorrect")

    with _otp_lock:
        _otp_store[body.email]["verified"] = True

    return {"message": "Code vérifié"}


@router.post("/reset-password")
def reset_password(body: ResetPasswordBody, db: Session = Depends(get_db)):
    with _otp_lock:
        entry = _otp_store.get(body.email)

    if not entry or entry["type"] != "reset":
        raise HTTPException(status_code=400, detail="Code invalide ou expiré")
    if datetime.utcnow() > entry["expires"]:
        with _otp_lock:
            _otp_store.pop(body.email, None)
        raise HTTPException(status_code=400, detail="Code expiré. Veuillez en demander un nouveau.")
    if entry["code"] != body.code:
        raise HTTPException(status_code=400, detail="Code incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères")

    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    user.hashed_password = hash_password(body.new_password)
    db.commit()

    with _otp_lock:
        _otp_store.pop(body.email, None)

    return {"message": "Mot de passe réinitialisé avec succès"}
