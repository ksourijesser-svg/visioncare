from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from decimal import Decimal
from collections import Counter, OrderedDict
from app.db.base import get_db
from app.models.patient import Patient
from app.models.appointment import Appointment, AppointmentStatus
from app.models.facture import Facture, FactureStatus
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/rapports", tags=["Rapports"])

MOIS_FR = ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"]
STATUT_LABELS = {"programme": "Programmé", "confirme": "Confirmé", "complete": "Complété", "annule": "Annulé"}


def _period_start(periode: str) -> tuple[date, int]:
    today = date.today()
    if periode == "mois":
        return today.replace(day=1), 1
    if periode == "trimestre":
        m = today.month - 2
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        return date(y, m, 1), 3
    # annee
    m = today.month - 11
    y = today.year
    while m <= 0:
        m += 12
        y -= 1
    return date(y, m, 1), 12


def _month_buckets(months: int) -> "OrderedDict[str, dict]":
    today = date.today()
    buckets: OrderedDict[str, dict] = OrderedDict()
    y, m = today.year, today.month
    seq = []
    for _ in range(months):
        seq.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    for (yy, mm) in reversed(seq):
        buckets[f"{yy}-{mm:02d}"] = {"mois": MOIS_FR[mm], "key": f"{yy}-{mm:02d}"}
    return buckets


@router.get("")
def get_rapports(
    periode: str = Query("annee", pattern="^(mois|trimestre|annee)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start, months = _period_start(periode)
    start_dt = datetime.combine(start, datetime.min.time())
    mid = current_user.id

    # ── Appointments in period ──
    rdvs = db.query(Appointment).filter(
        Appointment.medecin_id == mid,
        Appointment.date_heure >= start_dt,
    ).all()

    # ── Factures in period ──
    factures = db.query(Facture).filter(
        Facture.medecin_id == mid,
        Facture.date_emission >= start,
    ).all()

    # ── New patients in period ──
    patients = db.query(Patient).filter(
        Patient.medecin_id == mid,
        Patient.created_at >= start_dt,
    ).all()

    # KPIs — revenue
    revenue_total = sum((Decimal(str(f.montant_total or 0)) for f in factures), Decimal("0"))
    revenue_encaisse = sum((Decimal(str(f.montant_paye or 0)) for f in factures), Decimal("0"))
    revenue_impaye = revenue_total - revenue_encaisse

    # KPIs — appointments
    rdv_total = len(rdvs)
    rdv_completes = sum(1 for r in rdvs if r.statut == AppointmentStatus.complete)
    rdv_annules = sum(1 for r in rdvs if r.statut == AppointmentStatus.annule)
    taux_annulation = round((rdv_annules / rdv_total) * 100, 1) if rdv_total else 0.0
    taux_presence = round((rdv_completes / rdv_total) * 100, 1) if rdv_total else 0.0

    # Monthly series
    rev_buckets = _month_buckets(months)
    for k in rev_buckets:
        rev_buckets[k].update({"facture": 0.0, "encaisse": 0.0})
    for f in factures:
        k = f.date_emission.strftime("%Y-%m")
        if k in rev_buckets:
            rev_buckets[k]["facture"] += float(f.montant_total or 0)
            rev_buckets[k]["encaisse"] += float(f.montant_paye or 0)

    rdv_buckets = _month_buckets(months)
    for k in rdv_buckets:
        rdv_buckets[k].update({"rdv": 0})
    for r in rdvs:
        k = r.date_heure.strftime("%Y-%m")
        if k in rdv_buckets:
            rdv_buckets[k]["rdv"] += 1

    pat_buckets = _month_buckets(months)
    for k in pat_buckets:
        pat_buckets[k].update({"patients": 0})
    for p in patients:
        if p.created_at:
            k = p.created_at.strftime("%Y-%m")
            if k in pat_buckets:
                pat_buckets[k]["patients"] += 1

    # RDV by status (pie)
    statut_counter = Counter(r.statut.value for r in rdvs if r.statut)
    rdv_par_statut = [
        {"statut": s, "label": STATUT_LABELS.get(s, s), "count": c}
        for s, c in statut_counter.items()
    ]

    # Top motifs
    motif_counter = Counter((r.motif or "Non précisé").strip() or "Non précisé" for r in rdvs)
    top_motifs = [{"motif": m, "count": c} for m, c in motif_counter.most_common(5)]

    return {
        "periode": periode,
        "kpis": {
            "revenue_total": float(revenue_total),
            "revenue_encaisse": float(revenue_encaisse),
            "revenue_impaye": float(revenue_impaye),
            "rdv_total": rdv_total,
            "rdv_completes": rdv_completes,
            "nouveaux_patients": len(patients),
            "taux_presence": taux_presence,
            "taux_annulation": taux_annulation,
        },
        "revenue_par_mois": list(rev_buckets.values()),
        "rdv_par_mois": list(rdv_buckets.values()),
        "patients_par_mois": list(pat_buckets.values()),
        "rdv_par_statut": rdv_par_statut,
        "top_motifs": top_motifs,
    }
