# CLAUDE.md

**VisionCare** is a multi-tenant SaaS platform for ophthalmology practices, French-language UI. Patients, appointments, consultations, calendar, dashboard analytics. Each doctor's data is isolated by `medecin_id`.

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

## Dev Commands

```bash
# Frontend (from frontend/)
npm run dev        # :3000
npm run lint

# Backend (from backend/)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Full stack
docker-compose up --build
```

## Demo Credentials

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Médecin | `medecin@visioncare.fr` | `demo1234` |
| Secrétaire | `secretaire@visioncare.fr` | `demo1234` |

Auto-seeded on startup via `lifespan` in `main.py`.

## Architecture

### Frontend (`frontend/src/`)

```
app/
  page.tsx              # Landing page (public, dark #060F1E bg, dot grid + orbs)
  prise-rdv/page.tsx    # Public patient booking — doctor autocomplete, creates RDV
  (auth)/
    login/              # login page
    inscription/        # Multi-step role selection: Médecin form | Secrétaire form
  (dashboard)/          # protected layout — sidebar + header
    dashboard/          # welcome banner, stat cards, charts, today's RDV
    patients/           # patient cards (only patients with ≥1 complete RDV)
    rendez-vous/        # appointments table + status update + dossier modal
    calendrier/         # Mois / Semaine / Jour calendar views
    profil/             # doctor profile + cabinet info editor

hooks/
  usePatients.ts        # list, create, update, delete — filtered by medecin_id
  useAppointments.ts    # list, create, update, updateStatus, delete
                        #   transforms date_heure ↔ date+heure strings

components/
  layout/Sidebar.tsx    # nav + SVG eye widget + rotating tip + logout
  layout/Header.tsx     # page title + bell + avatar dropdown
  appointments/AppointmentModal.tsx   # create/edit RDV, auto-creates patient
  appointments/ConsultationModal.tsx  # saves diagnostic/traitement via API
  patients/PatientDetail.tsx          # slide-over, consultation history
  dashboard/StatCard.tsx              # KPI card

store/
  appointmentsStore.ts  # Zustand — type source only (do not use CRUD methods)
  patientsStore.ts      # Zustand — type source only
  profileStore.ts       # Zustand — doctor profile, persisted to localStorage
```

**Path alias**: `@/*` → `src/*`

### Backend (`backend/app/`)

```
api/routes/
  auth.py          # POST /login (OAuth2 form), POST /register, GET /me
  patients.py      # CRUD + Excel export — filter by medecin_id
  appointments.py  # CRUD for rendez_vous — filter by medecin_id
  dashboard.py     # aggregated stats
  public.py        # Unauthenticated: GET /public/doctors/search, POST /public/rendez-vous
core/config.py     # DATABASE_URL, SECRET_KEY, CORS_ORIGINS
core/security.py   # JWT, hash_password, verify_password
main.py            # lifespan: create_tables + seed_demo_users
```

All routes prefixed `/api/v1`. Health: `GET /health`.

### Data Model

- **User**: `medecin` | `secretaire` roles, JWT auth, telephone, cabinet, specialisation, type_cabinet
- **Patient**: nom, prenom, date_naissance, telephone, email, adresse, notes, `medecin_id` FK
- **Appointment** (`rendez_vous`): patient_id, medecin_id, date_heure (datetime), duree, motif, statut, notes, diagnostic, traitement

### Table creation — NO Alembic
Tables via `Base.metadata.create_all()` in `main.py`. New columns via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in the same function. Do **not** use `alembic upgrade head`.

### State Management
Server state → React Query hooks. Zustand stores → type interfaces only. `profileStore` → localStorage persistence.

### Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Vercel (Root Dir: `frontend/`) | auto-deploy from `main` |
| Backend | Railway | `https://visioncare-production-f7e6.up.railway.app` |
| Database | Railway PostgreSQL | `DATABASE_URL` env var |

`NEXT_PUBLIC_API_URL` → set in `frontend/.env.production` (committed). Do **not** rely on Vercel UI env vars.
**bcrypt pin**: `passlib==1.7.4` + `bcrypt==4.0.1` separately — `passlib[bcrypt]` pulls breaking bcrypt 4.x.

## Key Conventions & Gotchas

### Multi-tenant isolation — CRITICAL
Every backend route touching patients/appointments **must** filter `medecin_id == current_user.id`.

### User roles
Three actors: **Médecin**, **Secrétaire** (both use dashboard), **Patient** (books via `/prise-rdv` public page).
`inscription/page.tsx` shows a role-selection step first, then renders the matching form.

### Public (unauthenticated) routes
`GET /api/v1/public/doctors/search?q=` — searches User by name/cabinet (medecin + is_active only).
`POST /api/v1/public/rendez-vous` — auto-creates Patient + Appointment under the selected `medecin_id`, statut=`programme`. Frontend calls via `publicApi` in `lib/api.ts`.

### Appointment statuses
`programme` | `confirme` | `complete` | `annule`
Patients page only shows patients with ≥1 `complete` RDV (filtered client-side).

### Appointment date/time
Backend: `date_heure: datetime`. Frontend: separate `date + heure` strings.
`toISO(date, heure)` in `useAppointments.ts` normalizes AM/PM → 24h. Fetch splits on `'T'`.

### New patient auto-creation
`AppointmentModal.onSubmit` calls `patientsApi.create()` first if no patient selected from autocomplete. Sends `null` (not `''`) for optional fields — Pydantic `EmailStr` rejects empty strings.

### Login uses OAuth2 form encoding
`authApi.login()` sends `application/x-www-form-urlencoded` (URLSearchParams). Backend uses `OAuth2PasswordRequestForm`.

### Zod v4 — CRITICAL
Do **not** use `.optional().default('')` with `zodResolver` — `.default()` widens input type causing mismatch.
**Fix**: plain `z.string()` in schema + `defaultValues` in `useForm`.

### Shadcn/ui — Base UI (not Radix)
`DropdownMenuTrigger` and similar do **not** support `asChild`. Apply classes directly to trigger.

### Autocomplete inside Dialog — CRITICAL
Do **not** use `absolute` positioning inside a `@base-ui/react` Dialog — stacking context clips it.
**Fix**: inline element in document flow (pushes content down). On standalone pages like `/prise-rdv`, `absolute` is fine.

### Profile persistence
`profileStore.updateProfile()` writes to two localStorage keys: `user` (name/email/tel/cabinet) and `profile_extra` (specialite, rpps, cabinet_*).

### Calendar views
`calendrier/page.tsx`: Mois/Semaine/Jour. Nav arrows move by respective unit. Click day number → Jour view. Time grid 08:00–19:00.

### UI Design System

**Dashboard**: background `#C5D8E6`, cards white `shadow-sm rounded-2xl`. Active nav `bg-[#3d8fa8] text-white`, inactive `text-gray-600`.
**Landing page**: dark `#060F1E` background + dot-grid overlay + 3 gradient orbs. Navbar glass `bg-[#060F1E]/85 backdrop-blur`.
**Landing sections**: "Pourquoi choisir VisionCare?" `bg-white` with 3 SVG illustration cards. Fonctionnalités section `bg-[#C5D8E6]`. No Spécialités section (ophthalmology-only).
**Colors**: primary teal `#70B1C4`, active teal `#3d8fa8`, dark text `#1A2B3C`.
**Neon CSS classes** (in `globals.css`): `btn-neon` (teal glow), `btn-neon-white` (white/silver glow), `btn-neon-outline` (soft outline glow).
**Glow utilities**: `glow`, `glow-md`, `glow-green`, `glow-violet`, `glow-red`, `glow-sidebar`.
**StatCard**: icon top-left, value top-right; accepts `glowClass` prop.

### Shadcn Select null guard
`onValueChange={(v) => { if (v) setValue(...) }}` — types `v` as `string | null`.
