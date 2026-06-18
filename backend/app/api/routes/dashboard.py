from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.db.base import get_db
from app.models.patient import Patient
from app.models.appointment import Appointment, AppointmentStatus
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    patients_total = db.query(func.count(Patient.id)).scalar()

    rdv_aujourd_hui = db.query(func.count(Appointment.id)).filter(
        func.date(Appointment.date_heure) == today,
        Appointment.medecin_id == current_user.id,
    ).scalar()

    consultations_semaine = db.query(func.count(Appointment.id)).filter(
        func.date(Appointment.date_heure) >= week_start,
        Appointment.statut == AppointmentStatus.complete,
        Appointment.medecin_id == current_user.id,
    ).scalar()

    rdv_confirmes = db.query(func.count(Appointment.id)).filter(
        Appointment.statut == AppointmentStatus.confirme,
        Appointment.medecin_id == current_user.id,
    ).scalar()

    rdv_annules = db.query(func.count(Appointment.id)).filter(
        Appointment.statut == AppointmentStatus.annule,
        Appointment.medecin_id == current_user.id,
    ).scalar()

    rdv_completes = db.query(func.count(Appointment.id)).filter(
        Appointment.statut == AppointmentStatus.complete,
        Appointment.medecin_id == current_user.id,
    ).scalar()

    return {
        "patients_total": patients_total,
        "rendez_vous_aujourd_hui": rdv_aujourd_hui,
        "consultations_semaine": consultations_semaine,
        "rendez_vous_confirmes": rdv_confirmes,
        "rendez_vous_annules": rdv_annules,
        "rendez_vous_completes": rdv_completes,
    }
