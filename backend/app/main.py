from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import (
    auth, patients, appointments, dashboard, public, factures,
    salle_attente, rapports, patient_files, operations, ordonnances,
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
    import app.models.ordonnance  # noqa
    Base.metadata.create_all(bind=engine)
    # Add columns that may be missing on existing tables
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS diagnostic TEXT",
            "ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS traitement TEXT",
            "ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS salle_statut VARCHAR",
            "ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS heure_arrivee TIMESTAMP WITH TIME ZONE",
            "ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS prix_consultation DOUBLE PRECISION",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS specialisation VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS type_cabinet VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS adresse VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_maps_url VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS photo TEXT",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS antecedents_generaux TEXT",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS antecedents_ophtalmologiques TEXT",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS prise_en_charge VARCHAR",
            "ALTER TABLE ordonnances ADD COLUMN IF NOT EXISTS lentilles JSON",
            # `type` was a Postgres enum (medicale|lunettes) — convert to plain text
            # so new kinds (lentilles, …) don't need an enum migration.
            "ALTER TABLE ordonnances ALTER COLUMN type TYPE VARCHAR USING type::text",
        ]:
            # Commit each statement on its own so one failure can't abort the batch.
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                conn.rollback()
    print("Database tables ensured")


def seed_demo_users():
    try:
        from app.db.base import SessionLocal
        from app.models.user import User, UserRole
        from app.core.security import hash_password

        db = SessionLocal()
        try:
            demos = [
                {"email": "medecin@ophtech.fr", "password": "demo1234", "nom": "Dupont", "prenom": "Jean", "role": UserRole.medecin, "cabinet": "Cabinet Ophtech"},
                {"email": "secretaire@ophtech.fr", "password": "demo1234", "nom": "Martin", "prenom": "Sophie", "role": UserRole.secretaire, "cabinet": "Cabinet Ophtech"},
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
app.include_router(ordonnances.router, prefix=settings.API_V1_STR)


@app.get("/health")
def health():
    return {"status": "ok", "version": settings.VERSION}
