# TheBridge

*One person's private bridge between mind, body, and daily routine.*

TheBridge is a personal life companion fusing three things:

- 🕰 **Journal** — diary and thoughts
- 🌊 **Regulator** — calm breathing and grounding exercises, with a 60-second SOS reset
- 📈 **Tracker** — sleep, meals and weight, turned into graphs and gentle insights

Full plan: [`docs/PLAN.md`](docs/PLAN.md)

## Stack

| Layer | Tech |
|---|---|
| Backend | Spring Boot 4.1 · Java 26 · Spring Security (JWT + Argon2) · JPA · Flyway · PostgreSQL (Neon) |
| Frontend | Vite 8 · React 19 · TypeScript · Tailwind v4 · TanStack Query · React Router |

## Prerequisites

- Java 26 (or edit the toolchain in `backend/build.gradle` to 17/21/25)
- Node.js 22+

## Configuration

Secrets live in `.env` at the repo root (gitignored, already set up):

- `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` — Neon Postgres
- `DATABASE_URL` — same database as a plain URI, for CLI tools
- `JWT_SECRET` — token signing secret

## Run it

Terminal 1 — backend:

```powershell
cd backend
.\gradlew.bat bootRun
```

Terminal 2 — frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

**First run:** the app detects an empty database and offers *Create your account* on the
login screen. The first account becomes the only account — registration closes behind it.

## API (Phase 0)

```
GET  /api/v1/auth/status       → { registrationOpen }
POST /api/v1/auth/register     → { token, expiresAt, user }   (only while no user exists)
POST /api/v1/auth/login        → { token, expiresAt, user }
GET  /api/v1/auth/me           → current user (JWT required)
GET  /api/v1/dashboard/today   → date, gems balance, practice streak (JWT required)
GET  /actuator/health          → health probe
```

Everything except `/api/v1/auth/**` and `/actuator/health` requires
`Authorization: Bearer <token>`.

## Database

Flyway migrations in `backend/src/main/resources/db/migration` are the only source of
schema truth (`ddl-auto: validate` guards drift):

- `V1__core_schema.sql` — users, diary, thoughts, exercises, sessions, gem ledger, sleep, meals, weight
- `V2__seed_exercises.sql` — the calm exercise catalog
- `V3__align_smallint_columns.sql` — integer alignment for Hibernate validation
