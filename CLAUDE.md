# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VisionCare** is a multi-tenant SaaS platform for medical practices, with a French-language UI. It handles patients, appointments (rendez-vous), consultations, a calendar, and dashboard analytics. Each doctor has a fully isolated account — patients and appointments are scoped to `medecin_id`.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Server state | TanStack React Query 5 + Axios |
| UI state | Zustand 5 (profile only) |
| Forms | React Hook Form 7 + Zod 4 |
| UI | Shadcn/ui (Base UI based) + Lucide icons + Recharts |
| Backend | FastAPI (Python), SQLAlchemy 2, PostgreSQL 16 |
| Auth | JWT (python-jose + bcrypt==4.0.1 + passlib==1.7.4) |
| Infra | Railway (backend + PostgreSQL) + Vercel (frontend) |

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
```

### Full Stack
```bash
docker-compose up --build
```

## Demo Credentials

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Médecin | `medecin@visioncare.fr` | `demo1234` |
| Secrétaire | `secretaire@visioncare.fr` | `demo1234` |

Demo users are auto-seeded on every backend startup via the `lifespan` event in `main.py`.

## Architecture

### Frontend (`frontend/src/`)

```
app/
  page.tsx                     # SaaS landing page (public, no auth)
  (auth)/
    login/                     # login page
    inscription/               # doctor registration page → auto-login → dashboard
  (dashboard)/                 # protected layout — sidebar + header
    dashboard/                 # welcome banner, stat cards, charts, today's RDV
    patients/                  # patient cards (only patients with completed RDV)
    rendez-vous/               # appointments table + status update + dossier modal
    calendrier/                # Mois / Semaine / Jour calendar views
    profil/                    # doctor profile + cabinet info editor

hooks/                         # React Query hooks (replace Zustand for server state)
  usePatients.ts               # list, create, update, delete — all filtered by medecin_id
  useAppointments.ts           # list, create, update, updateStatus, delete
                               #   transforms date_heure (datetime) ↔ date+heure (strings)
                               #   includes diagnostic?, traitement? fields

providers/
  QueryProvider.tsx            # QueryClient wrapper — wraps entire app in layout.tsx

components/
  layout/
    Sidebar.tsx                # nav + decorative eye widget + rotating tip + logout → /
    Header.tsx                 # page title + bell + avatar dropdown → Mon profil
  appointments/
    AppointmentModal.tsx       # create/edit RDV — autocomplete existing patients;
                               #   auto-creates new patient if none selected
    ConsultationModal.tsx      # Dossier modal: saves patient info + diagnostic/traitement
                               #   via real API (useUpdatePatient + useUpdateAppointment)
  patients/
    PatientDetail.tsx          # slide-over panel — consultation history via useAppointments
    PatientModal.tsx           # create/edit patient form
  dashboard/
    StatCard.tsx               # KPI card — icon top-left, value top-right
  ui/                          # Shadcn primitives (button, dialog, card, etc.)

store/
  appointmentsStore.ts         # Zustand — Appointment interface only (type source of truth)
                               #   diagnostic?, traitement? included in interface
  patientsStore.ts             # Zustand — Patient interface only (type source of truth)
  profileStore.ts              # Zustand — doctor/cabinet profile, persisted to localStorage
```

**Path alias**: `@/*` → `src/*`

### Backend (`backend/app/`)

```
api/routes/
  auth.py          # POST /login (OAuth2 form), POST /register, GET /me
  patients.py      # CRUD + Excel export — ALL queries filter by medecin_id
  appointments.py  # CRUD for rendez_vous — ALL queries filter by medecin_id
  dashboard.py     # aggregated stats
core/
  config.py        # DATABASE_URL, SECRET_KEY, CORS_ORIGINS
  security.py      # JWT creation/verification, hash_password, verify_password
models/            # SQLAlchemy ORM models
schemas/           # Pydantic request/response schemas
db/base.py         # engine + SessionLocal + get_db
main.py            # app factory — lifespan creates tables + seeds demo users
```

All API routes prefixed `/api/v1`. Health check: `GET /health`.

### Data Model

- **User**: `medecin` | `secretaire` roles, JWT auth, telephone, cabinet, specialisation, type_cabinet
- **Patient**: nom, prenom, date_naissance, telephone, email, adresse, notes, `medecin_id` (FK)
- **Appointment** (`rendez_vous`): patient_id, medecin_id, date_heure (datetime), duree, motif, statut, notes, diagnostic, traitement

### Table creation — NO Alembic migrations
There are no migration files in `migrations/versions/`. Tables are created via `Base.metadata.create_all()` in `main.py`'s `create_tables()`. New columns are added with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in the same function. Do **not** rely on `alembic upgrade head` to create tables — it will silently do nothing.

### State Management

Server state uses **React Query hooks** (`hooks/usePatients.ts`, `hooks/useAppointments.ts`).
Zustand stores (`appointmentsStore`, `patientsStore`) are kept only for their TypeScript interfaces — do not use their CRUD methods for new features.
`profileStore` remains active for doctor profile (localStorage persistence).

### Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel (Root Dir: `frontend/`) | auto-deployed from `main` branch |
| Backend | Railway | `https://visioncare-production-f7e6.up.railway.app` |
| Database | Railway PostgreSQL | `DATABASE_URL` env var on Railway |

**Vercel env var**: `NEXT_PUBLIC_API_URL` is set in `frontend/.env.production` (committed to git) — do **not** rely on the Vercel UI env var, it doesn't save reliably and the root-level `vercel.json` is ignored when Root Directory is `frontend/`.

**bcrypt pin**: `requirements.txt` must have `passlib==1.7.4` + `bcrypt==4.0.1` separately. Using `passlib[bcrypt]` without pinning pulls in bcrypt 4.x which breaks password hashing.

## Key Conventions & Known Gotchas

### French-only UI
All labels, field names are in French. Date formatting uses `date-fns/locale/fr`.

### Multi-tenant isolation — CRITICAL
Every backend route that touches patients or appointments **must** filter by `medecin_id == current_user.id`. Never query without this filter or doctors will see each other's data.

### Appointment statuses
`programme` | `confirme` | `complete` | `annule`
Patients **only appear on the Patients page** once at least one RDV is marked **complete** (filtered client-side in `patients/page.tsx`).

### Appointment date/time transformation
Backend stores `date_heure: datetime` (e.g. `"2026-06-20T09:00:00"`).
Frontend uses separate `date: string` + `heure: string` fields.
The `toISO(date, heure)` helper in `useAppointments.ts` normalizes AM/PM to 24h before sending.
On fetch, the transform splits `date_heure.split('T')` to extract date and time.

### New patient auto-creation in AppointmentModal
If the user types a patient name manually without selecting from autocomplete, `AppointmentModal.onSubmit` calls `patientsApi.create()` first, gets the new `patient_id`, then creates the appointment. Sends `null` (not `''`) for optional patient fields (email, adresse, date_naissance) because Pydantic's `EmailStr` rejects empty strings.

### Login uses OAuth2 form encoding
`authApi.login()` sends `application/x-www-form-urlencoded` (URLSearchParams), not JSON. The backend uses `OAuth2PasswordRequestForm` which requires this format.

### Zod v4 — CRITICAL
Do **not** use `.optional().default('')` on schema fields when using `zodResolver`.
In Zod v4, `.default()` makes the input type `string | undefined`, which causes a type mismatch.
**Fix**: use plain `z.string()` in schema + set `defaultValues` in `useForm`.

### Shadcn/ui — Base UI (not Radix)
This project uses the Base UI variant of Shadcn. `DropdownMenuTrigger` and similar components do **not** support the `asChild` prop. Apply classes directly to the trigger element.

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
