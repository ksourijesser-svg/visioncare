from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
import io
import openpyxl
from app.db.base import get_db
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate, PatientOut
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=list[PatientOut])
def list_patients(
    search: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Patient).filter(Patient.medecin_id == current_user.id)
    if search:
        q = q.filter(
            or_(
                Patient.nom.ilike(f"%{search}%"),
                Patient.prenom.ilike(f"%{search}%"),
                Patient.telephone.ilike(f"%{search}%"),
                Patient.email.ilike(f"%{search}%"),
            )
        )
    return q.order_by(Patient.nom).offset((page - 1) * limit).limit(limit).all()


@router.get("/export")
def export_patients(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patients = db.query(Patient).filter(Patient.medecin_id == current_user.id).all()
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Patients"
    ws.append(["ID", "Nom", "Prénom", "Date de naissance", "Téléphone", "Email", "Adresse"])
    for p in patients:
        ws.append([p.id, p.nom, p.prenom, str(p.date_naissance or ""), p.telephone or "", p.email or "", p.adresse or ""])
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=patients.xlsx"},
    )


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.medecin_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient introuvable")
    return patient


@router.post("", response_model=PatientOut, status_code=201)
def create_patient(data: PatientCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = Patient(**data.model_dump(), medecin_id=current_user.id)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(patient_id: int, data: PatientUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.medecin_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient introuvable")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.medecin_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient introuvable")
    db.delete(patient)
    db.commit()
