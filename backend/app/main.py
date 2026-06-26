from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import (
    auth, patients, appointments, dashboard, public, factures,
    salle_attente, rapports, patient_files, operations,
)


def create_tables():
    from app.db.base import engine, Base
    from sqlalchemy import text
    import app.models.user        # noqa — register models
    import app.models.patient     # noqa
    import app.models.appointment # noqa
    import app.models.facture     # noqa
    import app.models.patient_file # noqa
    import app.models.operation   # noqa
    Base.metadata.create_all(bind=engine)
    # Add columns that may be missing on existing tables
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS diagnostic TEXT",
            "ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS traitement TEXT",
            "ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS salle_statut VARCHAR",
            "ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS heure_arrivee TIMESTAMP WITH TIME ZONE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS specialisation VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS type_cabinet VARCHAR",
        ]:
            try:
                conn.execute(text(stmt))
            except Exception:
                pass
        conn.commit()
    print("Database tables ensured")


def seed_demo_users():
    try:
        from app.db.base import SessionLocal
        from app.models.user import User, UserRole
        from app.core.security import hash_password

        db = SessionLocal()
        try:
            demos = [
                {"email": "medecin@visioncare.fr", "password": "demo1234", "nom": "Dupont", "prenom": "Jean", "role": UserRole.medecin, "cabinet": "Cabinet VisionCare"},
                {"email": "secretaire@visioncare.fr", "password": "demo1234", "nom": "Martin", "prenom": "Sophie", "role": UserRole.secretaire, "cabinet": "Cabinet VisionCare"},
            ]
            for u in demos:
                if not db.query(User).filter(User.email == u["email"]).first():
                    db.add(User(
                        email=u["email"],
                        hashed_password=hash_password(u["password"]),
                        nom=u["nom"],
                        prenom=u["prenom"],
                        role=u["role"],
                        cabinet=u["cabinet"],
                    ))
            db.commit()
            print("Demo users seeded successfully")
        finally:
            db.close()
    except Exception as e:
        print(f"Warning: demo user seeding skipped — {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    seed_demo_users()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(patients.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(public.router, prefix=settings.API_V1_STR)
app.include_router(factures.router, prefix=settings.API_V1_STR)
app.include_router(salle_attente.router, prefix=settings.API_V1_STR)
app.include_router(rapports.router, prefix=settings.API_V1_STR)
app.include_router(patient_files.router, prefix=settings.API_V1_STR)
app.include_router(operations.router, prefix=settings.API_V1_STR)


@app.get("/health")
def health():
    return {"status": "ok", "version": settings.VERSION}
