from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from datetime import datetime
from app.db.base import get_db
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.appointment import Appointment, AppointmentStatus

router = APIRouter(prefix="/public", tags=["Public"])


@router.get("/doctors/search")
def search_doctors(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    doctors = (
        db.query(User)
        .filter(
            User.role == UserRole.medecin,
            User.is_active == True,
            or_(
                User.nom.ilike(f"%{q}%"),
                User.prenom.ilike(f"%{q}%"),
                User.cabinet.ilike(f"%{q}%"),
            ),
        )
        .limit(10)
        .all()
    )
    return [
        {
            "id": d.id,
            "nom": d.nom,
            "prenom": d.prenom,
            "cabinet": d.cabinet,
            "specialisation": d.specialisation,
        }
        for d in doctors
    ]


class PublicRdvCreate(BaseModel):
    medecin_id: int
    nom: str
    prenom: str
    telephone: str
    adresse: str | None = None
    date_heure: datetime
    motif: str | None = None


@router.post("/rendez-vous", status_code=201)
def create_public_rdv(data: PublicRdvCreate, db: Session = Depends(get_db)):
    doctor = (
        db.query(User)
        .filter(
            User.id == data.medecin_id,
            User.role == UserRole.medecin,
            User.is_active == True,
        )
        .first()
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Médecin introuvable")

    patient = Patient(
        nom=data.nom,
        prenom=data.prenom,
        telephone=data.telephone,
        adresse=data.adresse,
        medecin_id=data.medecin_id,
    )
    db.add(patient)
    db.flush()

    rdv = Appointment(
        patient_id=patient.id,
        medecin_id=data.medecin_id,
        date_heure=data.date_heure,
        duree=30,
        motif=data.motif,
        statut=AppointmentStatus.programme,
    )
    db.add(rdv)
    db.commit()
    return {"message": "Rendez-vous créé avec succès", "rdv_id": rdv.id}
