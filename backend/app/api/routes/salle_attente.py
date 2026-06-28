from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime, timedelta
from pydantic import BaseModel
from app.db.base import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/salle-attente", tags=["Salle d'attente"])

VALID = {"attente", "en_consultation", "termine"}


class SalleStatutUpdate(BaseModel):
    salle_statut: str | None  # None = remettre "à venir" (annule l'arrivée)
    prix_consultation: float | None = None  # saisi lors du passage en "terminé"


def _serialize(rdv: Appointment) -> dict:
    p = rdv.patient
    return {
        "id": rdv.id,
        "patient_id": rdv.patient_id,
        "patient_nom": p.nom if p else "",
        "patient_prenom": p.prenom if p else "",
        "patient_telephone": p.telephone if p else "",
        "heure": rdv.date_heure.strftime("%H:%M") if rdv.date_heure else "",
        "motif": rdv.motif or "",
        "duree": rdv.duree or 30,
        "statut": rdv.statut.value if rdv.statut else "programme",
        "salle_statut": rdv.salle_statut,
        "heure_arrivee": rdv.heure_arrivee.isoformat() if rdv.heure_arrivee else None,
        "prix_consultation": rdv.prix_consultation,
    }


@router.get("")
def list_today(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    rdvs = (
        db.query(Appointment)
        .options(joinedload(Appointment.patient))
        .filter(
            Appointment.medecin_id == current_user.id,
            Appointment.date_heure >= today,
            Appointment.date_heure < today + timedelta(days=1),
            Appointment.statut != AppointmentStatus.annule,
        )
        .order_by(Appointment.date_heure)
        .all()
    )
    return [_serialize(r) for r in rdvs]


@router.patch("/{rdv_id}")
def update_salle_statut(
    rdv_id: int,
    data: SalleStatutUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rdv = db.query(Appointment).filter(
        Appointment.id == rdv_id, Appointment.medecin_id == current_user.id
    ).first()
    if not rdv:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")

    new = data.salle_statut
    if new is not None and new not in VALID:
        raise HTTPException(status_code=400, detail="Statut de salle invalide")

    rdv.salle_statut = new
    if new == "attente":
        if rdv.heure_arrivee is None:
            rdv.heure_arrivee = datetime.now()
        # L'arrivée du patient en salle d'attente confirme le rendez-vous
        rdv.statut = AppointmentStatus.confirme
    if new is None:
        rdv.heure_arrivee = None
    if new == "termine":
        # Terminer la consultation marque le RDV comme complété
        rdv.statut = AppointmentStatus.complete
        if data.prix_consultation is not None:
            rdv.prix_consultation = data.prix_consultation

    db.commit()
    db.refresh(rdv)
    fresh = db.query(Appointment).options(joinedload(Appointment.patient)).filter(Appointment.id == rdv_id).first()
    return _serialize(fresh)
