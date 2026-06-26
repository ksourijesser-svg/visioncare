from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from urllib.parse import quote
from app.db.base import get_db
from app.models.patient import Patient
from app.models.patient_file import PatientFile
from app.schemas.patient_file import PatientFileOut
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/patients/{patient_id}/files", tags=["Patient files"])

MAX_SIZE = 10 * 1024 * 1024  # 10 MB per file


def _owned_patient(db: Session, patient_id: int, user: User) -> Patient:
    patient = db.query(Patient).filter(
        Patient.id == patient_id, Patient.medecin_id == user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient introuvable")
    return patient


@router.get("", response_model=list[PatientFileOut])
def list_files(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _owned_patient(db, patient_id, current_user)
    return (
        db.query(PatientFile)
        .filter(PatientFile.patient_id == patient_id, PatientFile.medecin_id == current_user.id)
        .order_by(PatientFile.created_at.desc(), PatientFile.id.desc())
        .all()
    )


@router.post("", response_model=PatientFileOut, status_code=201)
async def upload_file(
    patient_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_patient(db, patient_id, current_user)
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide")
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 10 Mo)")
    pf = PatientFile(
        patient_id=patient_id,
        medecin_id=current_user.id,
        filename=file.filename or "document",
        content_type=file.content_type,
        size=len(content),
        data=content,
    )
    db.add(pf)
    db.commit()
    db.refresh(pf)
    return pf


@router.get("/{file_id}")
def download_file(patient_id: int, file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pf = db.query(PatientFile).filter(
        PatientFile.id == file_id,
        PatientFile.patient_id == patient_id,
        PatientFile.medecin_id == current_user.id,
    ).first()
    if not pf:
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    return Response(
        content=pf.data,
        media_type=pf.content_type or "application/octet-stream",
        headers={"Content-Disposition": f"inline; filename*=UTF-8''{quote(pf.filename)}"},
    )


@router.delete("/{file_id}", status_code=204)
def delete_file(patient_id: int, file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pf = db.query(PatientFile).filter(
        PatientFile.id == file_id,
        PatientFile.patient_id == patient_id,
        PatientFile.medecin_id == current_user.id,
    ).first()
    if not pf:
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    db.delete(pf)
    db.commit()
