from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import date
from app.db.base import get_db
from app.models.ordonnance import Ordonnance, OrdonnanceType
from app.models.patient import Patient
from app.schemas.ordonnance import OrdonnanceCreate, OrdonnanceOut
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/ordonnances", tags=["Ordonnances"])


def _owns_patient(db: Session, patient_id: int, user: User):
    patient = db.query(Patient).filter(
        Patient.id == patient_id, Patient.medecin_id == user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient introuvable")


def _with_patient(db: Session, oid: int) -> Ordonnance:
    return db.query(Ordonnance).options(joinedload(Ordonnance.patient)).filter(Ordonnance.id == oid).first()


@router.get("", response_model=list[OrdonnanceOut])
def list_ordonnances(
    patient_id: int = Query(None),
    type: OrdonnanceType = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Ordonnance).options(joinedload(Ordonnance.patient)).filter(Ordonnance.medecin_id == current_user.id)
    if patient_id:
        q = q.filter(Ordonnance.patient_id == patient_id)
    if type:
        q = q.filter(Ordonnance.type == type.value)
    return q.order_by(Ordonnance.date_ordonnance.desc(), Ordonnance.id.desc()).all()


@router.get("/{ordonnance_id}", response_model=OrdonnanceOut)
def get_ordonnance(ordonnance_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    o = db.query(Ordonnance).options(joinedload(Ordonnance.patient)).filter(
        Ordonnance.id == ordonnance_id, Ordonnance.medecin_id == current_user.id
    ).first()
    if not o:
        raise HTTPException(status_code=404, detail="Ordonnance introuvable")
    return o


@router.post("", response_model=OrdonnanceOut, status_code=201)
def create_ordonnance(data: OrdonnanceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _owns_patient(db, data.patient_id, current_user)
    o = Ordonnance(
        patient_id=data.patient_id,
        medecin_id=current_user.id,
        type=data.type,
        date_ordonnance=data.date_ordonnance or date.today(),
        medicaments=[m.model_dump() for m in data.medicaments],
        verres=data.verres.model_dump() if data.verres else None,
        notes=data.notes,
    )
    db.add(o)
    db.commit()
    db.refresh(o)
    return _with_patient(db, o.id)


@router.delete("/{ordonnance_id}", status_code=204)
def delete_ordonnance(ordonnance_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    o = db.query(Ordonnance).filter(Ordonnance.id == ordonnance_id, Ordonnance.medecin_id == current_user.id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Ordonnance introuvable")
    db.delete(o)
    db.commit()
