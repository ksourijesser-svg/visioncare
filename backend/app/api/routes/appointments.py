from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import date, timedelta
from app.db.base import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentStatusUpdate, AppointmentOut
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/rendez-vous", tags=["Rendez-vous"])


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    date_rdv: date = Query(None, alias="date"),
    statut: AppointmentStatus = Query(None),
    patient_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Appointment).options(joinedload(Appointment.patient))
    q = q.filter(Appointment.medecin_id == current_user.id)
    if date_rdv:
        q = q.filter(Appointment.date_heure >= date_rdv, Appointment.date_heure < date_rdv + timedelta(days=1))
    if statut:
        q = q.filter(Appointment.statut == statut)
    if patient_id:
        q = q.filter(Appointment.patient_id == patient_id)
    return q.order_by(Appointment.date_heure).all()


@router.get("/{rdv_id}", response_model=AppointmentOut)
def get_appointment(rdv_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rdv = db.query(Appointment).options(joinedload(Appointment.patient)).filter(Appointment.id == rdv_id).first()
    if not rdv:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")
    return rdv


@router.post("", response_model=AppointmentOut, status_code=201)
def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rdv = Appointment(**data.model_dump(), medecin_id=current_user.id)
    db.add(rdv)
    db.commit()
    db.refresh(rdv)
    return db.query(Appointment).options(joinedload(Appointment.patient)).filter(Appointment.id == rdv.id).first()


@router.put("/{rdv_id}", response_model=AppointmentOut)
def update_appointment(rdv_id: int, data: AppointmentUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rdv = db.query(Appointment).filter(Appointment.id == rdv_id).first()
    if not rdv:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(rdv, field, value)
    db.commit()
    return db.query(Appointment).options(joinedload(Appointment.patient)).filter(Appointment.id == rdv_id).first()


@router.patch("/{rdv_id}/statut", response_model=AppointmentOut)
def update_status(rdv_id: int, data: AppointmentStatusUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rdv = db.query(Appointment).filter(Appointment.id == rdv_id).first()
    if not rdv:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")
    rdv.statut = data.statut
    db.commit()
    return db.query(Appointment).options(joinedload(Appointment.patient)).filter(Appointment.id == rdv_id).first()


@router.delete("/{rdv_id}", status_code=204)
def delete_appointment(rdv_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rdv = db.query(Appointment).filter(Appointment.id == rdv_id).first()
    if not rdv:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")
    db.delete(rdv)
    db.commit()
