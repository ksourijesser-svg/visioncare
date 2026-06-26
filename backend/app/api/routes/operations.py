from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.db.base import get_db
from app.models.operation import Operation, OperationStatus
from app.models.patient import Patient
from app.schemas.operation import OperationCreate, OperationUpdate, OperationOut
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/operations", tags=["Operations"])


def _owns_patient(db: Session, patient_id: int, user: User):
    patient = db.query(Patient).filter(
        Patient.id == patient_id, Patient.medecin_id == user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient introuvable")


def _with_patient(db: Session, oid: int) -> Operation:
    return db.query(Operation).options(joinedload(Operation.patient)).filter(Operation.id == oid).first()


@router.get("", response_model=list[OperationOut])
def list_operations(
    statut: OperationStatus = Query(None),
    patient_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Operation).options(joinedload(Operation.patient)).filter(Operation.medecin_id == current_user.id)
    if statut:
        q = q.filter(Operation.statut == statut)
    if patient_id:
        q = q.filter(Operation.patient_id == patient_id)
    return q.order_by(Operation.date_operation.asc()).all()


@router.get("/{operation_id}", response_model=OperationOut)
def get_operation(operation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    op = db.query(Operation).options(joinedload(Operation.patient)).filter(
        Operation.id == operation_id, Operation.medecin_id == current_user.id
    ).first()
    if not op:
        raise HTTPException(status_code=404, detail="Opération introuvable")
    return op


@router.post("", response_model=OperationOut, status_code=201)
def create_operation(data: OperationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _owns_patient(db, data.patient_id, current_user)
    op = Operation(**data.model_dump(), medecin_id=current_user.id)
    db.add(op)
    db.commit()
    db.refresh(op)
    return _with_patient(db, op.id)


@router.put("/{operation_id}", response_model=OperationOut)
def update_operation(operation_id: int, data: OperationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    op = db.query(Operation).filter(Operation.id == operation_id, Operation.medecin_id == current_user.id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Opération introuvable")
    payload = data.model_dump(exclude_none=True)
    if "patient_id" in payload:
        _owns_patient(db, payload["patient_id"], current_user)
    for field, value in payload.items():
        setattr(op, field, value)
    db.commit()
    return _with_patient(db, operation_id)


@router.delete("/{operation_id}", status_code=204)
def delete_operation(operation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    op = db.query(Operation).filter(Operation.id == operation_id, Operation.medecin_id == current_user.id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Opération introuvable")
    db.delete(op)
    db.commit()
