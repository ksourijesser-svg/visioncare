# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VisionCare** is a full-stack SaaS platform for ophthalmology practices, with a French-language UI. It handles patients, appointments (rendez-vous), consultations, a calendar, and dashboard analytics.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| State | Zustand 5 |
| Data fetching | TanStack React Query 5 + Axios |
| Forms | React Hook Form 7 + Zod 4 |
| UI | Shadcn/ui (Base UI based) + Lucide icons + Recharts |
| Backend | FastAPI (Python), SQLAlchemy 2, Alembic, PostgreSQL 16 |
| Auth | JWT (python-jose + bcrypt) |
| Infra | Docker Compose (postgres + backend + frontend + nginx) |

## Development Commands

### Frontend (from `frontend/`)
```bash
npm run dev       # start dev server on :3000
npm run lint      # ESLint
```

### Backend (from `backend/`)
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
alembic upgrade head
alembic revision --autogenerate -m "description"
```

### Full Stack
```bash
docker-compose up --build
```

## Demo Credentials (mock auth — no real backend needed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Médecin | `medecin@visioncare.fr` | `demo1234` |
| Secrétaire | `secretaire@visioncare.fr` | `demo1234` |

## Architecture

### Frontend (`frontend/src/`)

```
app/
  (auth)/login/              # public login route
  (dashboard)/               # protected layout — sidebar + header
    dashboard/               # welcome banner, stat cards, charts, today's RDV
    patients/                # patient cards grid + search + Excel export + dossier panel
    rendez-vous/             # appointments table + status update + dossier modal
    calendrier/              # Mois / Semaine / Jour calendar views
    profil/                  # doctor profile + cabinet info editor

components/
  layout/
    Sidebar.tsx              # nav with active state (solid teal), decorative eye widget + rotating tip, user card, logout
    Header.tsx               # page title + bell + avatar dropdown → Mon profil
  appointments/
    AppointmentModal.tsx     # create/edit RDV with patient autocomplete + dedup
    ConsultationModal.tsx    # Dossier button modal: patient info + diagnostic/traitement
  patients/
    PatientDetail.tsx        # slide-over panel — real consultation history from store
    PatientModal.tsx         # create/edit patient form
  dashboard/
    StatCard.tsx             # KPI card — icon top-left, value top-right
  ui/                        # Shadcn primitives (button, dialog, card, etc.)

store/
  appointmentsStore.ts       # Zustand — appointments CRUD + mock data
                             #   Appointment interface includes diagnostic?, traitement?
  patientsStore.ts           # Zustand — patients CRUD, addPatient returns new id
  profileStore.ts            # Zustand — doctor/cabinet profile, persisted to localStorage
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
  config.py        # DATABASE_URL, SECRET_KEY, CORS_ORIGINS
  security.py      # JWT creation/verification
models/            # SQLAlchemy ORM models
schemas/           # Pydantic request/response schemas
db/base.py         # engine + session setup
main.py            # app factory, route registration
```

All API routes prefixed `/api/v1`. Health check: `GET /health`.

### Data Model

- **User**: `medecin` | `secretaire` roles, JWT auth
- **Patient**: nom, prenom, date_naissance, telephone, email, adresse, notes, nb_consultations
- **Appointment** (`rendez_vous`): patient_id, date, heure, duree, motif, statut, notes, diagnostic?, traitement?
- **Consultation**: diagnostic, traitement, prescription, notes — linked to appointment

### State Management

The frontend uses **Zustand stores with mock in-memory data** — no live API calls yet.
- `appointmentsStore` — source of truth for all RDV data; `PatientDetail` reads from it directly
- `patientsStore` — patient records; `addPatient` returns the new `id`
- `profileStore` — doctor profile; syncs to `localStorage` (`user` key + `profile_extra` key)

When connecting to the backend: use React Query for server state, keep Zustand only for UI/local state.

### Environment Variables

| Variable | Where |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | frontend — defaults to `http://localhost:8000` |
| `DATABASE_URL` | backend |
| `SECRET_KEY` | backend (JWT signing) |
| `CORS_ORIGINS` | backend |

## Key Conventions & Known Gotchas

### French-only UI
All labels, field names, and mock data are in French. Date formatting uses `date-fns/locale/fr`.

### Appointment statuses
`programme` | `confirme` | `complete` | `annule`
Patients only appear on the Patients page once at least one RDV is marked **complete**.

### Zod v4 — CRITICAL
Do **not** use `.optional().default('')` on schema fields when using `zodResolver`.
In Zod v4, `.default()` makes the input type `string | undefined`, which causes a type mismatch.
**Fix**: use plain `z.string()` in schema + set `defaultValues` in `useForm`.

### Shadcn/ui — Base UI (not Radix)
This project uses the Base UI variant of Shadcn. `DropdownMenuTrigger` and similar components do **not** support the `asChild` prop. Apply classes directly to the trigger element.

### Patient deduplication
`AppointmentModal` has a patient autocomplete search (min 2 chars). On save, names are normalized with `toTitleCase()`. Selecting an existing patient links the RDV to their `patient_id`, preventing duplicate records.

### Autocomplete inside Dialog — CRITICAL
Do **not** use `absolute` positioning for dropdown suggestions inside a `@base-ui/react` Dialog. The Dialog's `Popup` creates a new CSS stacking context (`fixed` + `z-50` + `grid`), which clips absolutely-positioned children regardless of `z-index`.
**Fix**: render the suggestions list as a normal inline element (no `absolute`, no `z-index`) outside the `relative` wrapper but still in document flow — it pushes content down instead of floating.

### Profile persistence
`profileStore` saves to two `localStorage` keys on every `updateProfile()` call:
- `user` — name, email, telephone, cabinet name (shared with auth)
- `profile_extra` — specialite, rpps, cabinet_adresse, cabinet_telephone, cabinet_email, cabinet_site

### Calendar views
`calendrier/page.tsx` implements three views: Mois, Semaine, Jour.
- Navigation (← →) moves by month / week / day depending on active view.
- Clicking a day number in Mois view jumps to Jour view for that day.
- Time grid shows hours 08:00 → 19:00.

### UI Design System
- Background: `#E4EEF4` (blue-gray) — cards are white `shadow-sm rounded-2xl` on top of it
- Primary teal: `#70B1C4` — active nav, buttons, accents
- Dark text: `#1A2B3C`
- Sidebar: `glow-sidebar` shadow, active nav item = `bg-[#70B1C4] text-white shadow-md shadow-[#70B1C4]/25`
- Sidebar decorative widget: SVG eye illustration + rotating French tip (7 tips, picked by `new Date().getDay()`), sits in `flex-1 justify-end` between nav and user card
- Card component (`components/ui/card.tsx`): default is `rounded-2xl bg-white glow` — no border ring
- StatCard: icon top-left, value top-right, title below; accepts `glowClass` prop
- Dashboard has a gradient teal welcome banner
- Glow utilities defined in `globals.css`: `glow`, `glow-md`, `glow-green`, `glow-violet`, `glow-red`, `glow-sidebar`

### Shadcn Select null guard
`onValueChange` types `v` as `string | null`. Always guard: `onValueChange={(v) => { if (v) setValue(...) }}`
