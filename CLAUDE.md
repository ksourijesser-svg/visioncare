# CLAUDE.md

**Ophtech** is a multi-tenant SaaS platform for ophthalmology practices, French-language UI. Patients, appointments, consultations, calendar, dashboard analytics, billing (factures), live waiting room (salle d'attente), surgery scheduling (opérations), reports (rapports), patient document uploads, and prescriptions (ordonnances). Each doctor's data is isolated by `medecin_id`.

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
| Email | Resend API (HTTPS, no SMTP — Railway blocks SMTP ports) |
| Infra | Railway (backend + PostgreSQL) + Vercel (frontend) |

## Dev Commands

```bash
# Frontend (from frontend/)
npm run dev        # :3000
npm run lint

# Backend (from backend/)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**No Docker** — user has no admin rights to install Docker Desktop. Run backend + frontend directly.

## Demo Credentials

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Médecin | `medecin@ophtech.fr` | `demo1234` |
| Secrétaire | `secretaire@ophtech.fr` | `demo1234` |

Auto-seeded on startup via `lifespan` in `main.py`.

## Architecture

### Frontend (`frontend/src/`)

```
app/
  page.tsx              # Landing page (public, dark #060F1E bg, dot grid + orbs)
  prise-rdv/page.tsx    # Public patient booking — doctor autocomplete, creates RDV
  (auth)/
    login/              # Login page — dark medical theme (hex grid + ECG lines + glassmorphism card)
                        #   3 inline modes: login | forgot-email | forgot-code (no page change)
    inscription/        # Multi-step: Role selection → Médecin/Secrétaire form → Email verification (OTP)
                        #   Médecin form includes photo upload, bio, cabinet address + Google Maps link
  (dashboard)/          # protected layout — sidebar + header
    dashboard/          # welcome banner, stat cards, charts (real data from appointments), today's RDV
    patients/           # patient cards (only patients with ≥1 complete RDV)
    rendez-vous/        # appointments table + status update + dossier modal
    calendrier/         # Mois / Semaine / Jour calendar views
    salle-attente/      # live kanban board (À venir/En attente/En consultation/Terminé), auto-refresh 30s
    operations/         # surgery scheduling — agenda grouped by day + KPIs
    facturation/        # invoices: line items, payments, auto-status; KPIs + table
    rapports/           # analytics — revenue/RDV/patients charts, period selector
    profil/             # doctor profile editor — photo upload, bio, address, Google Maps link, cabinet info

hooks/
  usePatients.ts        # list, create, update, delete — filtered by medecin_id
  useAppointments.ts    # list, create, update, updateStatus, delete
                        #   transforms date_heure ↔ date+heure strings
  useFactures.ts        # invoices CRUD + recordPayment
  useSalleAttente.ts    # waiting-room list (refetch 30s) + updateStatut (invalidates appointments too)
  useRapports.ts        # reports aggregation (periode: mois|trimestre|annee)
  useOperations.ts      # surgeries CRUD
  usePatientFiles.ts    # list/upload/delete + fetchFileObjectUrl / fetchFileDataUrl (blob→url/base64)
  useOrdonnances.ts     # prescriptions list/create/delete (medicale|lunettes|lentilles)

components/
  layout/Sidebar.tsx    # nav + user card + logout (no eye widget — removed)
  layout/Header.tsx     # page title + bell + avatar dropdown
  appointments/AppointmentModal.tsx   # create/edit RDV, auto-creates patient; also captures patient dossier
                                       #   (date naissance, adresse, email, prise en charge) + antécédents (généraux/ophtalmo)
  appointments/ConsultationModal.tsx  # compte-rendu only (diagnostic/traitement) + "Opération ?" toggle → creates an Operation
  patients/PatientDetail.tsx          # full-view dialog (max-w-6xl, 3-col): info, antécédents & prise en charge,
                                       #   documents upload, ordonnances (click name → PDF new tab), consultations, export PDF
  patients/OrdonnanceModal.tsx        # create ordonnance — 3 tabs: médicale (meds rows + type/catégorie) / lunettes OD-OG / lentilles OD-OG
  factures/FactureModal.tsx           # create/edit invoice — patient autocomplete + line items
  factures/PaymentModal.tsx           # record a payment against an invoice
  operations/OperationModal.tsx       # schedule/edit a surgery
  dashboard/StatCard.tsx              # KPI card

lib/
  patientPdf.ts         # client-side dossier PDF via print window (embeds image attachments as base64)
  ordonnancePdf.ts      # client-side prescription PDF (medicale + lunettes + lentilles), doctor header from profileStore
                        #   exportOrdonnancePdf(data, { autoPrint }) — autoPrint:false opens in a new tab without print dialog
  image.ts              # fileToResizedDataUrl — downscales profile photo to ≤512px; keeps PNG/WebP transparency, else JPEG

store/
  appointmentsStore.ts  # Zustand — type source only (do not use CRUD methods)
  patientsStore.ts      # Zustand — type source only
  profileStore.ts       # Zustand — doctor profile, persisted to localStorage
```

**Path alias**: `@/*` → `src/*`

### Backend (`backend/app/`)

```
api/routes/
  auth.py          # POST /login, POST /register, GET /me, PUT /me (update doctor profile → DB)
                   # POST /auth/send-code      — sends 6-digit OTP via Resend (signup|reset)
                   # POST /auth/verify-code    — validates OTP for signup flow
                   # POST /auth/reset-password — validates OTP + changes password
  patients.py      # CRUD + Excel export — filter by medecin_id
  appointments.py  # CRUD for rendez_vous — filter by medecin_id
  patient_files.py # /patients/{id}/files — upload/list/download/delete (bytes in DB, 10MB max)
  ordonnances.py   # /ordonnances — prescriptions list/get/create/delete (medicale|lunettes|lentilles)
  operations.py    # /operations — surgery CRUD
  factures.py      # /factures — invoices CRUD + /{id}/paiement; auto-derives statut
  salle_attente.py # /salle-attente — today's RDV board + PATCH salle_statut (+ prix_consultation on termine)
  rapports.py      # /rapports?periode= — aggregated analytics (Python-side, portable)
  dashboard.py     # aggregated stats
  public.py        # Unauthenticated: GET /public/doctors/search, /doctors/{id}/place, /doctors/{id}/busy, POST /public/rendez-vous
core/config.py     # DATABASE_URL, SECRET_KEY, CORS_ORIGINS, RESEND_API_KEY, EMAIL_FROM, GOOGLE_PLACES_API_KEY
core/security.py   # JWT, hash_password, verify_password
core/email.py      # send_code_email() — Resend HTTP API via urllib (no new deps)
core/maps.py       # get_place_info() — resolves doctor's Google Maps link → embed coords + (optional) reviews
main.py            # lifespan: create_tables + seed_demo_users
```

All routes prefixed `/api/v1`. Health: `GET /health`.

### OTP / Email verification flow
- **Signup**: form submit → `POST /auth/send-code {email, type:"signup"}` → OTP step (6-box input, paste support, resend) → `POST /auth/verify-code` → `POST /auth/register` → auto-login
- **Forgot password**: "Mot de passe oublié?" → email step → `POST /auth/send-code {type:"reset"}` → code + new password step → `POST /auth/reset-password` → back to login
- OTPs stored **in-memory** (`_otp_store` dict, `threading.Lock`), 10-min TTL. Single Railway instance — fine for now.

### Data Model

- **User**: `medecin` | `secretaire` roles, JWT auth, telephone, cabinet, specialisation, type_cabinet, **adresse** (cabinet address → public map), **bio** (presentation shown to patients), **google_maps_url** (place link → reviews), **photo** (base64 data URL)
- **Patient**: nom, prenom, date_naissance, telephone, email, adresse, notes, **antecedents_generaux**, **antecedents_ophtalmologiques**, **prise_en_charge** (cnam|assurance_privee|autre), `medecin_id` FK. Antécédents & prise en charge are captured/edited from the **AppointmentModal** (RDV), displayed in the patient dossier.
- **Appointment** (`rendez_vous`): patient_id, medecin_id, date_heure (datetime), duree, motif, statut, notes, diagnostic, traitement, **salle_statut** (null|attente|en_consultation|termine), **heure_arrivee**, **prix_consultation** (float, captured when marking termine → reused for facture)
- **Facture** (`factures`): numero (`FAC-{year}-{NNNN}`), patient_id, medecin_id, date_emission, date_echeance, `lignes` (JSON: designation/quantite/prix_unitaire), montant_total, montant_paye, statut (impayee|partielle|payee|annulee), methode_paiement, date_paiement, notes
- **Operation** (`operations`): patient_id, medecin_id, date_operation (datetime), duree, type_intervention, oeil (droit|gauche|deux), anesthesie, salle, statut (planifiee|confirmee|terminee|annulee), notes
- **PatientFile** (`patient_files`): patient_id, medecin_id, filename, content_type, size, `data` (LargeBinary — stored in DB, not disk: Railway FS is ephemeral)
- **Ordonnance** (`ordonnances`): patient_id, medecin_id, **type** (medicale|lunettes|lentilles — plain **VARCHAR**, not a DB enum), date_ordonnance, `medicaments` (JSON list: medicament/**categorie**/posologie/duree/instructions), `verres` (JSON: type_correction/ecart_pupillaire/od/og × sphere,cylindre,axe,addition), **`lentilles`** (JSON: type_lentille[souple|rigide]/rythme_port[journalier…annuel]/produit_entretien/od/og × puissance,rayon,diametre), notes. `medicaments[].categorie` = drug type (antibiotique collyre/per os, corticoïde collyre/per os, antiglaucomateux, agent mouillant, pansement néopade, autre).

### Table creation — NO Alembic
Tables via `Base.metadata.create_all()` in `main.py`. New columns via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in the same function. Do **not** use `alembic upgrade head`. Each migration statement now **commits on its own** (`conn.commit()` per stmt, `rollback()` on error) so one failure can't abort the whole batch — needed because non-idempotent statements like `ALTER COLUMN ... TYPE VARCHAR` (no `IF NOT EXISTS`) can't be guarded.

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

### Railway env vars required

```
DATABASE_URL          = (set by Railway PostgreSQL plugin)
SECRET_KEY            = (strong random string)
RESEND_API_KEY        = re_...
EMAIL_FROM            = Ophtech <onboarding@resend.dev>
GOOGLE_PLACES_API_KEY = (optional) AIza... — enables inline Google reviews on the booking page
```

## Key Conventions & Gotchas

### No Docker — CRITICAL
User has no Docker Desktop (no admin rights). Never suggest `docker-compose up`. Run backend with `uvicorn` directly and frontend with `npm run dev`. DB in production is Railway PostgreSQL.

### Email — Resend only, no SMTP
Railway blocks all outbound SMTP ports (587 and 465). Use **Resend API** (`core/email.py`) via HTTPS. Do not switch back to `smtplib`. Resend API key in Railway env vars + `backend/.env` locally. Must include `User-Agent: Ophtech/1.0` header — Cloudflare blocks requests without it.

### Multi-tenant isolation — CRITICAL
Every backend route touching patients/appointments **must** filter `medecin_id == current_user.id`.

### User roles
Three actors: **Médecin**, **Secrétaire** (both use dashboard), **Patient** (books via `/prise-rdv` public page).
`inscription/page.tsx` shows a role-selection step first, then renders the matching form, then email OTP verification.

### Public (unauthenticated) routes
`GET /api/v1/public/doctors/search?q=` — searches User by name/cabinet (medecin + is_active only); returns photo, adresse, bio, google_maps_url too.
`GET /api/v1/public/doctors/{id}/place` — map embed query + (optional) Google reviews (see "Public doctor profile" below).
`GET /api/v1/public/doctors/{id}/busy` — occupied slots from today onward (times only).
`POST /api/v1/public/rendez-vous` — auto-creates Patient + Appointment under the selected `medecin_id`, statut=`programme`. Frontend calls via `publicApi` in `lib/api.ts`.

### Appointment statuses
`programme` | `confirme` | `complete` | `annule`
Patients page only shows patients with ≥1 `complete` RDV (filtered client-side).

### Salle d'attente — overlay on appointments (CRITICAL)
The waiting-room board is a **non-destructive overlay** on `rendez_vous` via two columns (`salle_statut`, `heure_arrivee`) — the core `statut` enum is never touched directly by board moves *except* the two auto-transitions below. `salle_statut`: `null` (À venir) → `attente` → `en_consultation` → `termine`.
- Moving to **`attente`** (clicking "Arrivé") sets `heure_arrivee=now()` **and** `statut = confirme` (so the Rendez-vous page shows Confirmé).
- Moving to **`termine`** (clicking "Terminer") sets `statut = complete`.
- These are forward-only — moving a patient *back* does not revert `statut`.
- Clicking **"Terminer"** opens a price modal (dark/light themed) requiring `prix_consultation`; on confirm it PATCHes `{salle_statut:'termine', prix_consultation}`. Stored on the appointment for later facture use.
`useUpdateSalleStatut` invalidates both `['salle-attente']` and `['appointments']` so the RDV page refreshes.

### Factures — auto-derived status (CRITICAL)
`statut` is computed server-side in `_derive_statut`: `annulee` is preserved; `paye<=0` → `impayee`; `paye>=total` → `payee`; else `partielle`. `montant_total` recomputed from `lignes` on create/update. Numero via `_next_numero` = `FAC-{year}-{count+1:04d}`.

### PDF export — client-side print window, NO backend PDF lib
No reportlab/weasyprint on the backend. Dossier (`lib/patientPdf.ts`) and prescriptions (`lib/ordonnancePdf.ts`) build a styled HTML document, `window.open` it, and call `window.print()` (user picks "Save as PDF"). Always rendered light (medical document). Image attachments embed as **base64 data URLs** (blob: URLs don't survive the separate window); the print trigger waits for images to decode. Prescription header pulls doctor identity (name, spécialité, RPPS, cabinet) from `profileStore`.
`exportOrdonnancePdf(data, { autoPrint })` — default `autoPrint:true` includes the print-trigger script; **`autoPrint:false` just opens the styled doc in a new tab for viewing** (no print dialog). In `PatientDetail`, clicking an ordonnance name (or the external-link icon) opens it with `autoPrint:false`; the printer icon uses `autoPrint:true`.

### Ordonnances — 3 types, `type` is VARCHAR not a DB enum (CRITICAL)
Types: `medicale` | `lunettes` | `lentilles`. The `type` column was a Postgres **enum** and was **converted to plain VARCHAR** (`ALTER COLUMN type TYPE VARCHAR USING type::text` in `main.py`) so adding future kinds needs **no `ALTER TYPE` enum surgery**. The Python `OrdonnanceType` (str, Enum) still validates input; the route stores `data.type.value` and filters with `type.value`. Kind-specific payloads live in separate JSON columns: `medicaments` / `verres` / `lentilles` (the others are null). `medicaments[].categorie` is stored inside the existing JSON (no migration).

### Patient files — bytes in Postgres
Uploaded via multipart to `/patients/{id}/files`; stored as `LargeBinary` in the DB (Railway disk is ephemeral). Because auth is a Bearer header, the browser can't use a plain `<img src>` — the frontend downloads the blob (`responseType: 'blob'`) and makes an object URL to view, or a base64 data URL to embed in the PDF.

### Appointment date/time
Backend: `date_heure: datetime`. Frontend: separate `date + heure` strings.
`toISO(date, heure)` in `useAppointments.ts` normalizes AM/PM → 24h. Fetch splits on `'T'`.

### New patient auto-creation
`AppointmentModal.onSubmit` calls `patientsApi.create()` first if no patient selected from autocomplete. Sends `null` (not `''`) for optional fields — Pydantic `EmailStr` rejects empty strings. It also **persists the patient dossier fields** captured on the RDV form (date_naissance, adresse, email, antecedents_generaux, antecedents_ophtalmologiques, prise_en_charge) — creating them for a new patient, or `patientsApi.update()` for an existing one. Backend `PatientUpdate` uses `exclude_none=True`, so clearing a field to empty won't null it out.

### Consultation → Operation
`ConsultationModal` holds only the compte-rendu (diagnostic/traitement) plus a **"Le patient nécessite une opération ?"** Non/Oui toggle. On Oui + save it calls `useCreateOperation` for the consultation's patient (same payload shape as `OperationModal`), so the surgery appears on the **Opérations** page (query invalidated). Forward-only: it creates, never edits.

### Dashboard charts — real data
`dashboard/page.tsx` builds `monthlyData` with `useMemo` over the last 6 months from `useAppointments()`: **Activité mensuelle** (bar) = RDV count per month; **Tendance des consultations** (line) = `statut === 'complete'` count per month. No mock arrays.

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

### Profile persistence — localStorage + backend
`profileStore.updateProfile()` writes to two localStorage keys (`user`, `profile_extra`) **and** fires `PUT /auth/me` (non-blocking) so the public-facing fields (photo, bio, `adresse`, `specialisation`, `google_maps_url`, cabinet) persist to the DB. This is required because the public booking page reads them from the backend, not localStorage. Backend `adresse` ↔ profile `cabinet_adresse`.

### Public doctor profile — photo, map & reviews (prise-rdv)
When a patient selects a doctor, `prise-rdv` calls `GET /public/doctors/{id}/place` (`core/maps.py`):
- **Map from the Google Maps link**: backend follows the `maps.app.goo.gl` short link (browser can't — CORS), extracts coordinates, returns `embed_q` for the keyless `maps.google.com/maps?q=...&output=embed` iframe. Falls back to `adresse`. Cached 6h.
- **Reviews**: only if `GOOGLE_PLACES_API_KEY` is set — `findplacefromtext` → place details → rating + up to 5 reviews shown inline, plus a "Voir tous les avis sur Google" link. No key → map + link only (no inline reviews; Google has no free/legal way to show full review text, and caps the API at 5).
- The doctor **photo** renders as a hero portrait blended into the blue card via a single **radial-gradient `mask-image`** (multi-layer `mask-composite` was unreliable). Transparent PNGs show as true cutouts.

### Header logout
`layout/Header.tsx` avatar dropdown has **Mon profil** + **Se déconnecter** (red item) — calls `removeToken()` then routes to `/login`.

### Calendar views
`calendrier/page.tsx`: Mois/Semaine/Jour. Nav arrows move by respective unit. Click day number → Jour view. Time grid 08:00–19:00.

### UI Design System

**Login page**: dark medical tech theme — navy gradient `#020B18→#051E36`, SVG hex grid (2 layers), ECG lines top-left + bottom-right, glassmorphism card with cyan neon border glow.
**Dashboard**: background `#C5D8E6`, cards white `shadow-sm rounded-2xl`.
**Sidebar** (`layout/Sidebar.tsx`): two-layer glassmorphism — transparent `<aside>` shell (`w-64 p-3`, keeps the `md:pl-64` layout footprint) wrapping an inner floating card (`rounded-[20px] backdrop-blur-2xl`). Light mode: `bg-white/70`, dark text, teal active state (`bg-[#3d8fa8]/14 text-[#15324a]`). Dark mode: translucent `bg-[#0A1A2E]/40` (glass — background shows through), active `bg-white/[0.10] text-white`. Nav items `rounded-xl mx-2`. Decorative cyan corner glow + diagonal sheen are **dark-mode only** (`hidden dark:block`) and kept very faint so brand text stays readable. Every text/border/bg has an explicit light + `dark:` variant. Nav order: Tableau de bord, Calendrier, Rendez-vous, Salle d'attente, Opérations, Patients, Facturation, Rapports — then Mon profil + user card at the bottom. The "Navigation" label is teal and readable; the old SVG eye widget + rotating tip card was removed.
**Landing page**: dark `#060F1E` background + dot-grid overlay + 3 gradient orbs. Navbar glass `bg-[#060F1E]/85 backdrop-blur`.
**Landing sections**: "Pourquoi choisir Ophtech?" `bg-white` with 3 SVG illustration cards. Fonctionnalités section `bg-[#C5D8E6]`. No Spécialités section (ophthalmology-only).
**Colors**: primary teal `#70B1C4`, active teal `#3d8fa8`, dark text `#1A2B3C`.
**Neon CSS classes** (in `globals.css`): `btn-neon` (teal glow), `btn-neon-white` (white/silver glow), `btn-neon-outline` (soft outline glow).
**Glow utilities**: `glow`, `glow-md`, `glow-green`, `glow-violet`, `glow-red`, `glow-sidebar`.
**StatCard**: icon top-left, value top-right; accepts `glowClass` prop.

### Shadcn Select null guard
`onValueChange={(v) => { if (v) setValue(...) }}` — types `v` as `string | null`.

### Select popup width — long option labels clip
`SelectContent` defaults to the trigger's width (`w-(--anchor-width)`) with `overflow-x-hidden` and `whitespace-nowrap` items, so long labels get cut off. For dropdowns with long option text (e.g. the médicament `categorie`), pass `alignItemWithTrigger={false} className="w-auto min-w-[240px] max-w-[calc(100vw-2rem)]"` to size the popup to its content.

### Dialog width — base `sm:max-w-sm` wins (CRITICAL)
`DialogContent` (`ui/dialog.tsx`) has a base `sm:max-w-sm`. A plain `max-w-*` (no `sm:` prefix) does **not** override it — `tailwind-merge` keeps both and the responsive class wins on ≥sm screens. To actually widen a dialog, use a matching `sm:` variant, e.g. `PatientDetail` uses `w-[95vw] max-w-6xl sm:max-w-6xl`.
