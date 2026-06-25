from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import date
from decimal import Decimal
from app.db.base import get_db
from app.models.facture import Facture, FactureStatus
from app.schemas.facture import FactureCreate, FactureUpdate, PaiementCreate, FactureOut
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/factures", tags=["Factures"])


def _compute_total(lignes: list[dict]) -> Decimal:
    total = Decimal("0")
    for l in lignes or []:
        q = Decimal(str(l.get("quantite", 0) or 0))
        pu = Decimal(str(l.get("prix_unitaire", 0) or 0))
        total += q * pu
    return total.quantize(Decimal("0.01"))


def _derive_statut(facture: Facture) -> FactureStatus:
    if facture.statut == FactureStatus.annulee:
        return FactureStatus.annulee
    paye = Decimal(str(facture.montant_paye or 0))
    total = Decimal(str(facture.montant_total or 0))
    if paye <= 0:
        return FactureStatus.impayee
    if paye >= total and total > 0:
        return FactureStatus.payee
    return FactureStatus.partielle


def _next_numero(db: Session, medecin_id: int) -> str:
    year = date.today().year
    count = db.query(Facture).filter(
        Facture.medecin_id == medecin_id,
        Facture.numero.like(f"FAC-{year}-%"),
    ).count()
    return f"FAC-{year}-{count + 1:04d}"


def _with_patient(db: Session, fid: int) -> Facture:
    return db.query(Facture).options(joinedload(Facture.patient)).filter(Facture.id == fid).first()


@router.get("", response_model=list[FactureOut])
def list_factures(
    statut: FactureStatus = Query(None),
    patient_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Facture).options(joinedload(Facture.patient))
    q = q.filter(Facture.medecin_id == current_user.id)
    if statut:
        q = q.filter(Facture.statut == statut)
    if patient_id:
        q = q.filter(Facture.patient_id == patient_id)
    return q.order_by(Facture.date_emission.desc(), Facture.id.desc()).all()


@router.get("/{facture_id}", response_model=FactureOut)
def get_facture(facture_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = db.query(Facture).options(joinedload(Facture.patient)).filter(
        Facture.id == facture_id, Facture.medecin_id == current_user.id
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    return f


@router.post("", response_model=FactureOut, status_code=201)
def create_facture(data: FactureCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lignes = [l.model_dump() for l in data.lignes]
    facture = Facture(
        numero=_next_numero(db, current_user.id),
        patient_id=data.patient_id,
        medecin_id=current_user.id,
        date_emission=data.date_emission or date.today(),
        date_echeance=data.date_echeance,
        lignes=lignes,
        montant_total=_compute_total(lignes),
        montant_paye=Decimal("0"),
        notes=data.notes,
    )
    facture.statut = _derive_statut(facture)
    db.add(facture)
    db.commit()
    db.refresh(facture)
    return _with_patient(db, facture.id)


@router.put("/{facture_id}", response_model=FactureOut)
def update_facture(facture_id: int, data: FactureUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = db.query(Facture).filter(Facture.id == facture_id, Facture.medecin_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    payload = data.model_dump(exclude_none=True)
    if "lignes" in payload:
        f.lignes = [l.model_dump() for l in data.lignes]
        f.montant_total = _compute_total(f.lignes)
    for field in ("date_emission", "date_echeance", "notes"):
        if field in payload:
            setattr(f, field, payload[field])
    if "statut" in payload:
        f.statut = payload["statut"]
    f.statut = _derive_statut(f)
    db.commit()
    return _with_patient(db, facture_id)


@router.post("/{facture_id}/paiement", response_model=FactureOut)
def record_payment(facture_id: int, data: PaiementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = db.query(Facture).filter(Facture.id == facture_id, Facture.medecin_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    f.montant_paye = (Decimal(str(f.montant_paye or 0)) + Decimal(str(data.montant))).quantize(Decimal("0.01"))
    f.methode_paiement = data.methode_paiement
    f.date_paiement = data.date_paiement or date.today()
    f.statut = _derive_statut(f)
    db.commit()
    return _with_patient(db, facture_id)


@router.delete("/{facture_id}", status_code=204)
def delete_facture(facture_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = db.query(Facture).filter(Facture.id == facture_id, Facture.medecin_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    db.delete(f)
    db.commit()
