from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.core.maps import get_place_info
from app.db.base import get_db
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.appointment import Appointment, AppointmentStatus

router = APIRouter(prefix="/public", tags=["Public"])


def _naive(dt: datetime) -> datetime:
    """Strip tzinfo so naive (incoming) and aware (DB) datetimes compare cleanly."""
    return dt.replace(tzinfo=None) if dt.tzinfo is not None else dt


def _slot_conflict(db: Session, medecin_id: int, start: datetime, duree: int = 30) -> bool:
    """True if [start, start+duree) overlaps an existing (non-cancelled) RDV of the doctor."""
    start = _naive(start)
    end = start + timedelta(minutes=duree)
    appts = (
        db.query(Appointment)
        .filter(
            Appointment.medecin_id == medecin_id,
            Appointment.statut != AppointmentStatus.annule,
        )
        .all()
    )
    for appt in appts:
        s = _naive(appt.date_heure)
        e = s + timedelta(minutes=appt.duree or 30)
        if start < e and s < end:  # overlap
            return True
    return False


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
            "adresse": d.adresse,
            "google_maps_url": d.google_maps_url,
            "photo": d.photo,
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

    if _slot_conflict(db, data.medecin_id, data.date_heure):
        raise HTTPException(
            status_code=409,
            detail="Temps occupé, voir le calendrier du médecin",
        )

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


@router.get("/doctors/{doctor_id}/busy")
def doctor_busy(doctor_id: int, db: Session = Depends(get_db)):
    """Occupied slots (from today onward) for a doctor — times only, no patient data."""
    doctor = (
        db.query(User)
        .filter(User.id == doctor_id, User.role == UserRole.medecin, User.is_active == True)
        .first()
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Médecin introuvable")

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    appts = (
        db.query(Appointment)
        .filter(
            Appointment.medecin_id == doctor_id,
            Appointment.statut != AppointmentStatus.annule,
        )
        .order_by(Appointment.date_heure.asc())
        .all()
    )
    return [
        {"date_heure": a.date_heure.isoformat(), "duree": a.duree or 30}
        for a in appts
        if _naive(a.date_heure) >= today
    ]
