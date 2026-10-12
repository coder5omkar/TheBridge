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

## Structure

- **Today** — dashboard: checklist, gems, streak, sleep + calm charts
- **Diary** — the daily hub: my rhythm (habits with streaks), mood, energy, intention, thoughts inbox, journal, sleep card, evening review
- **Calm** — breathing exercises with the 60-second SOS reset
- **Health** — weight (+BMI via height) and food / eating habits
- **Garden** — Phase 2 gem sink

## API (Phase 1)

```
POST /api/v1/auth/login        → { token, expiresAt, user }
GET  /api/v1/auth/me           → current user (includes heightCm)
GET  /api/v1/dashboard/today   → checklist state, gems, streak, 14-day sleep & calm charts
GET  /api/v1/diary/today       → today's entry (204 when empty)   PUT to upsert (+2 💎 first save, +3 💎 evening review)
GET  /api/v1/calm/exercises    → seeded catalog with breathing patterns
POST /api/v1/calm/sessions     → record practice (1 💎/min + 2 💎 first of day), kind=regular|sos
GET  /api/v1/sleep/latest      → most recent night
POST /api/v1/sleep/bedtime     → "going to bed now"
POST /api/v1/sleep/wake        → "I'm awake" (+1 💎)
GET  /api/v1/thoughts          → open thoughts (mental inbox)
POST /api/v1/thoughts          → capture (worry | idea | gratitude | task)
PATCH /api/v1/thoughts/{id}    → reframe and/or release (+2 💎 once)
GET  /api/v1/health/summary    → weight trend, BMI, meals today + week stats
POST /api/v1/health/weight     → weigh-in (+3 💎 first of the week)
POST /api/v1/health/meals      → log a meal (type, description, home-cooked)
PATCH /api/v1/health/profile   → height in cm
GET  /api/v1/habits/today      → habits with done state, streaks, last-7-days history
POST /api/v1/habits            → define a practice (name, emoji, part: morning|afternoon|evening|anytime)
POST /api/v1/habits/{id}/toggle→ check off / undo (+1 💎 once per habit per day)
DELETE /api/v1/habits/{id}     → archive a practice (history kept)
GET  /actuator/health          → health probe
```

Everything except `/api/v1/auth/**`, `/error` and `/actuator/health` requires
`Authorization: Bearer <token>`.

### Gem rules

- 1 gem per completed practice minute (min 1), +2 for the first session of the day
- Diary entry +2 (once), evening review +3 (once), sleep wake +1 (once)
- Thought released (reframed and let go) +2 (once per thought)
- First weigh-in of the week +3
- Habit checked off +1 (once per habit per day; undo/redo never double-earns)
- Soft daily cap of 25 gems; balance is always `SUM(gem_ledger.delta)`
- SOS is always free and always earns like any other session

## Database

Flyway migrations in `backend/src/main/resources/db/migration` are the only source of
schema truth (`ddl-auto: validate` guards drift):

- `V1__core_schema.sql` — users, diary, thoughts, exercises, sessions, gem ledger, sleep, meals, weight
- `V2__seed_exercises.sql` — the calm exercise catalog
- `V3__align_smallint_columns.sql` — integer alignment for Hibernate validation
- `V4__sleep_flexible_times.sql` — bedtime and wake can be logged independently
