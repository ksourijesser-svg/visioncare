# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VisionCare** is a full-stack SaaS platform for ophthalmology practices, with a French-language UI. It handles patients, appointments (rendez-vous), consultations, and dashboard analytics.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| State | Zustand 5 |
| Data fetching | TanStack React Query 5 + Axios |
| Forms | React Hook Form 7 + Zod 4 |
| UI | Shadcn/ui components + Lucide icons + Recharts |
| Backend | FastAPI (Python), SQLAlchemy 2, Alembic, PostgreSQL 16 |
| Auth | JWT (python-jose + bcrypt) |
| Infra | Docker Compose (postgres + backend + frontend + nginx) |

## Development Commands

### Frontend (from `frontend/`)
```bash
npm run dev       # start dev server on :3000
npm run build     # production build
npm run lint      # ESLint
```

### Backend (from `backend/`)
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
alembic upgrade head    # run migrations
alembic revision --autogenerate -m "description"  # generate migration
```

### Full Stack
```bash
docker-compose up --build   # starts postgres + backend + frontend + nginx
```

## Architecture

### Frontend (`frontend/src/`)

```
app/
  (auth)/login/          # public login route
  (dashboard)/           # protected layout with sidebar
    dashboard/           # stats, charts, today's appointments
    patients/            # patient list + search + Excel export
    rendez-vous/         # appointments management
    calendrier/          # calendar view
components/
  layout/                # Sidebar, Header
  appointments/          # AppointmentModal
  patients/              # PatientModal, PatientDetail
  dashboard/             # StatCard
  ui/                    # Shadcn primitives (button, dialog, table, etc.)
store/
  appointmentsStore.ts   # Zustand store — appointments CRUD + mock data
  patientsStore.ts       # Zustand store — patients CRUD + mock data
```

**Path alias**: `@/*` → `src/*`

### Backend (`backend/app/`)

```
api/routes/
  auth.py          # POST /api/v1/auth/login
  patients.py      # CRUD + Excel export
  appointments.py  # CRUD for rendez_vous
  dashboard.py     # aggregated stats
core/
  config.py        # settings (DATABASE_URL, SECRET_KEY, CORS_ORIGINS)
  security.py      # JWT creation/verification
models/            # SQLAlchemy ORM models
schemas/           # Pydantic request/response schemas
db/base.py         # engine + session setup
main.py            # app factory, route registration
```

All API routes are prefixed `/api/v1`. Health check: `GET /health`.

### Data Model

- **User**: `medecin` | `secretaire` roles, JWT auth
- **Patient**: name, DOB, phone, email, address, SSN, notes
- **Appointment** (`rendez_vous`): linked to patient + doctor, status enum `programme | confirme | complete | annule`
- **Consultation**: diagnostic, treatment, prescription, notes — linked to appointment

### State Management

The frontend currently uses **Zustand stores with mock in-memory data** (no live API calls wired yet). When connecting to the backend, use React Query for server state and keep Zustand only for UI/local state.

### Environment Variables

| Variable | Where |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | frontend — defaults to `http://localhost:8000` |
| `DATABASE_URL` | backend |
| `SECRET_KEY` | backend (JWT signing) |
| `CORS_ORIGINS` | backend |

## Key Conventions

- All UI labels, field names, and mock data are in **French** (patients, rendez-vous, médecin, secrétaire, etc.)
- Date formatting uses `date-fns` with the `fr` locale
- Appointments status values: `programme`, `confirme`, `complete`, `annule`
- Shadcn components live in `components/ui/` — extend there, don't duplicate primitives
- Backend schemas (Pydantic) are separate from ORM models — keep them in sync when adding fields
