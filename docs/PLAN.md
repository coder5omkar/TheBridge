# TheBridge — Project Plan

*One person's private bridge between mind, body, and daily routine.*

**Status:** Phase 1 complete (2026-10-12) — diary, calm player + SOS, gems earning, sleep log, dashboard charts · **Next step:** Phase 2 (thoughts, meals, weight, garden)
**Decisions locked:** single-user app (multi-user later = config change, not rewrite) · Neon Postgres provisioned · gems buy Garden + themes · Spring Boot + Vite React

---

## 1. The vision

TheBridge fuses three apps into one personal sanctuary:

| Facet | What it is | Sections |
|---|---|---|
| 🕰 **Journal (past)** | What happened, what I felt, what I think | Diary, Thoughts |
| 🌊 **Regulator (present)** | Pull me out of a spiral *right now* | Calm exercises, SOS button |
| 📈 **Tracker (patterns)** | What my routine is doing to me over weeks | Sleep, Eating, Weight, Graphs |

The uniting daily loop:

> **capture → regulate → see the pattern → adjust → get rewarded**

Working title meaning: a bridge between mind and body, day and night, thought and habit.

### Non-goals (explicitly out of scope)
- Not a medical device: no diagnoses, no crisis intervention, no medical claims
- Not social or competitive: no leaderboards, no sharing, no third-party analytics
- Not a diet app: habit-first, never calorie-first or restriction-first
- Not multi-user at launch (but `user_id` exists on every table from day one)

---

## 2. The daily loop (UX story)

| Time | Action | Result |
|---|---|---|
| 06:45 | Tap "I'm awake" (1 tap, ~3 sec) | Sleep log closes, duration computed, +1 💎 |
| 07:10 | Morning intention + 2-min box breathing | Calm start, +2 💎 |
| 12:30 | Quick-log lunch (tags: home-cooked, hungry) | Meal streak tick |
| 15:00 | Stress hits → **"Calm me now"** → 60-sec physiological sigh | Nervous system downshifted, +1 💎 |
| 19:00 | Capture 3 fleeting thoughts into Mental Inbox | Inbox holds 3 items |
| 22:40 | Evening review (3 prompts) + 4-7-8 breathing → bedtime log | +5 💎, gem animation, day sealed |

**Design rules that make this work:**
1. Everything loggable in **under 10 seconds** — quick-add first, detail optional.
2. The **SOS button** is visible on every screen and *always free*.
3. The day is sealed with one satisfying reward moment (animation, chime optional).

---

## 3. Modules

| # | Module | What it does | The twist |
|---|---|---|---|
| 1 | **Diary** | Daily entry: mood (1–5), energy, tags, free text | Split into *morning intention* + *evening review* (3 prompts) |
| 2 | **Calm** | Seeded catalog: box / 4-7-8 / coherent breathing, 5-4-3-2-1 grounding, body scan, PMR | Session recording: start, duration, completed; **SOS mode** = 60-sec reset |
| 3 | **Thoughts** | Mental Inbox: quick-capture, tag (worry / idea / gratitude / task) | Gentle CBT loop: reframe ("what's in my control?") then **release** |
| 4 | **Sleep** | Bedtime, waketime, quality (1–5), "what delayed me" note | Bedtime *consistency* and sleep midpoint, not just duration |
| 5 | **Eating** | Meal log: type, time, home/out, company, hunger scale, water | Habit metrics (regularity, home-cooked ratio) — **no calorie-first UI** |
| 6 | **Weight** | Periodic weigh-in, optional note | 7-day moving average + goal *band*; charted beside mood/sleep for context |
| 7 | **Rewards** | Gem ledger, streaks, level, Garden, themes | Anti-frustration economy (section 4) |
| 8 | **Insights** | Weekly card: 3 auto-generated observations + all graph screens | Templated correlations, always labeled "patterns, not proof" |

**Information architecture note (2026-10-12):** daily-rhythm things live together in **Diary** (my rhythm habits, mood, energy, intention, journal, thoughts inbox, sleep card, evening review). Slow body signals live in **Health** (weight, height/BMI, food & eating habits). Calm stays its own practice space; weight is *not* part of the daily entry.

---

## 4. Gem economy

Gems need both a **source** and a **sink**, or they feel hollow. Design goal: reward, never pressure.

### Earning (soft daily cap ~25 — a reward, not a grind)

| Action | Gems |
|---|---|
| Exercise session | 1/min of practice |
| First session of the day | +2 bonus |
| Evening review completed | +3 |
| Diary entry | +2 |
| Sleep log (on wake) | +1 |
| Weekly weigh-in | +3 |
| Thought captured + reframed | +2 |
| Every 7-day streak milestone | +10 |

### Spending (locked decision: Garden + themes first)

| Sink | Available | Notes |
|---|---|---|
| 🪴 **Garden** | Phase 2 | Plants grow with care; seasonal seeds; Finch-style warmth |
| 🎨 Themes | Phase 2 | Calm palettes, night variants, seasonal skins |
| 🛡 Streak freeze | Phase 3 | Auto-applied 1×/week; missing a day never resets to zero |
| Sound packs | Backlog | Rain / forest / ocean for exercises |

### Principles
- SOS calm is **always free**, no exceptions
- No loss mechanics, no decay, no guilt notifications
- Balance is derived: `SUM(gem_ledger.delta)` — never a mutable counter

---

## 5. Data model

| Table | Key fields | Notes |
|---|---|---|
| `users` | email, password_hash, timezone, `day_start_hour` (default 4) | Single row at launch; columns ready for multi-user |
| `diary_entries` | user_id, entry_date, morning_intent, evening_review, mood, energy, tags[] | One per user per day (unique constraint) |
| `thoughts` | user_id, content, kind, status (open/released), reframe, created_at | Mental Inbox |
| `exercises` | slug, name, type, pattern (e.g. `[4,4,4,4]`), duration_options, description | Seeded via Flyway, not user-generated |
| `exercise_sessions` | user_id, exercise_id, started_at, duration_sec, completed, gems_awarded | SOS sessions flagged |
| `gem_ledger` | user_id, delta, reason, ref_type, ref_id, created_at | Append-only |
| `sleep_logs` | user_id, sleep_date, bed_time, wake_time, quality, delay_note | `sleep_date` = the day you wake |
| `meals` | user_id, eaten_at, meal_type, description, home_cooked, hunger_before/after | |
| `weight_entries` | user_id, measured_at, weight_kg, note | Weigh-ins are not daily |
| `garden_items` | user_id, plant_type, planted_at, growth_stage, last_cared_at | Phase 2 |
| `user_unlocks` | user_id, item_slug, unlocked_at, gems_spent | Phase 2 |

**Time model:** store all timestamps UTC; compute "the day" in the user's timezone with `day_start_hour` (so logging bed time at 1:00 AM counts as the previous day).

---

## 6. Architecture

```
TheBridge/
├── backend/                 # Spring Boot 4.1 · Java 21/25 LTS · Gradle
│   ├── src/main/java/.../thebridge/
│   │   ├── auth/  users/
│   │   ├── diary/  thoughts/
│   │   ├── calm/            # exercises + sessions
│   │   ├── rewards/         # ledger, streaks, garden, shop
│   │   ├── tracking/        # sleep, meals, weight
│   │   ├── insights/        # charts + weekly observations
│   │   └── common/          # config, security, errors, time
│   └── src/main/resources/db/migration/   # Flyway
├── frontend/                # Vite 8 · React 19 · TypeScript
│   └── src/features/{diary,calm,thoughts,tracking,rewards,dashboard}/
├── docker-compose.yml       # postgres (optional local) + backend; serves built frontend in prod
├── docs/PLAN.md
└── .env                     # secrets (gitignored)
```

Each backend module = entity · repository · service · controller · DTOs (vertical slice, mirrors frontend feature folder).

### Stack

| Layer | Choices |
|---|---|
| Backend | Spring Boot 4.1.x, Spring Web, Spring Data JPA, Spring Security (JWT), Flyway, PostgreSQL 18, springdoc OpenAPI, Actuator, Testcontainers, `@Scheduled` weekly insight job |
| Frontend | Vite 8 + React 19 + TS, React Router, TanStack Query v5 (server state), react-hook-form + zod, Tailwind v4 + shadcn/ui, Recharts (graphs), Framer Motion (reward moments, breathing pacer), vite-plugin-pwa, date-fns-tz |
| Deploy | docker-compose on small VPS / Fly.io / Railway · Caddy for HTTPS · nightly `pg_dump` + Neon point-in-time restore |

### API sketch (`/api/v1`)

```
POST   /auth/login                → JWT (single account; registration opens only once)
GET    /dashboard/today           → one call powers the home screen
── diary ──
GET/PUT /diary/{date}
── thoughts ──
GET/POST /thoughts                PATCH /thoughts/{id}   (reframe, release)
── calm ──
GET    /calm/exercises            POST /calm/sessions    (records completion + gems)
── tracking ──
GET/POST /sleep     GET/POST /meals     GET/POST /weight
── rewards ──
GET    /rewards/summary           (balance, streak, level)
GET    /rewards/garden            POST /rewards/shop/unlock
── insights ──
GET    /insights/weekly           GET /insights/charts/{metric}
```

### Auth (single-user model)
- One account; `POST /auth/login` → JWT (short-lived access + refresh)
- First-run: registration allowed only while `users` is empty; then it closes itself
- Optional TOTP 2FA later; password hashing with Argon2
- No analytics SDKs, no third-party scripts — this data is intimate by nature

---

## 7. Graphs & insights

| Screen | Visuals |
|---|---|
| Sleep | Duration bars + rolling average · bedtime consistency scatter · sleep midpoint |
| Mood | 30-day line, overlaid on sleep for the eye to catch patterns |
| Weight | Raw dots + 7-day moving average + goal band |
| Eating | Meal-time regularity heatmap · home-cooked ratio |
| Calm | GitHub-style contribution calendar for practice streaks |
| Weekly Insights | 3 templated observations, e.g. *"Weeks you slept ≥7h, mood logged +0.8"* — always with "patterns, not proof" |

Implementation: SQL aggregates in service layer first; correlation templates in the `insights` module. No ML until there's real data.

---

## 8. Roadmap

| Phase | Scope | Definition of done |
|---|---|---|
| **0 — Skeleton** | Repo layout, Neon wired via Flyway, Boot + auth, Vite + routing + theme, `GET /dashboard/today` | App runs; login works; one styled page fetches from backend |
| **1 — MVP: the full daily loop** | Diary + mood, 3 breathing exercises + SOS mode, gem ledger + balance, sleep log, dashboard with 2 charts | A complete day can be lived inside the app |
| **2 — Depth** | Thoughts inbox + reframe, meals, weight + moving average, streak calendar, insights v1, Garden + themes shop | Every module has data and at least one graph |
| **3 — Companion** | PWA install + offline shell, 2–3 gentle reminders, audio guidance, export/backup, correlation insights v2 | Installable on phone; data exportable as JSON |

Rule: every phase ends with something usable **daily** — ship vertical slices, not half-modules.

---

## 9. Principles & risks

| Risk | Design response |
|---|---|
| Scope (8 modules) | MVP = daily loop only; anything else waits for Phase 2 |
| Privacy | Self-hosted, hash + HTTPS, no third-party scripts, app-level encryption for diary/thoughts bodies (Phase 3), one-click export |
| Gamification backfire | Daily caps, streak forgiveness, SOS always free, zero punishment mechanics |
| Wellness safety | Not a medical device; gentle crisis-resources line; habits over calories; weight shown beside mood/sleep, never alone |
| Sparse data → ugly charts | Empty states ("not enough data yet") + demo seed mode for development |
| Timezone / day boundary | UTC storage, user-timezone days, `day_start_hour` default 4 AM |
| Notification fatigue | Max 2–3 user-configured reminders; all off by default except evening review |

---

## 10. Environments

### Neon Postgres (provisioned 2026-10-12)

| | |
|---|---|
| Project | `thebridge` → id `plain-wind-69215343` |
| Region | `aws-ap-southeast-1` (Singapore, same as existing "the mind village" project) |
| Postgres | 18 |
| Branch / DB / role | `main` (`br-raspy-grass-b38tfbwm`) / `neondb` / `neondb_owner` |
| Compute | 0.25–0.25 CU, autosuspend 0s (free plan) |
| Connection string | `.env` at repo root (`DATABASE_URL`, `SPRING_DATASOURCE_*`) — **never commit** |

Notes:
- Dev connects through the Neon **pooler** host; the direct host is kept in `.env` as a comment.
- Neon gives ~6h point-in-time history on the free plan; add a weekly `pg_dump` before Phase 2.
- Region cannot be changed after creation — if you later deploy to another region, recreate the project there and restore.
- IP allowlist stays open for now; lock later to VPS + home IP once hosting is decided.

---

## 11. Backlog (post-MVP ideas)

- Audio-guided exercises (own voice recordings or licensed packs)
- Haptic breathing pacer on mobile (vibration API)
- Telegram/WhatsApp bot as a capture channel
- Encrypted diary bodies (AES-GCM, key from env)
- Correlation insights v2 (lagged analysis: last night's sleep → today's mood)
- Seasonal garden events

---

## 12. Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-10-12 | Single-user at launch | Simplest auth/privacy; `user_id` everywhere keeps multi-user cheap |
| 2026-10-12 | Neon Postgres, aws-ap-southeast-1 | Zero-ops managed DB; matches existing project's region |
| 2026-10-12 | Gems → Garden + themes | Warm, non-competitive sink; avoids paywalling calm |
| 2026-10-12 | JWT + Argon2, registration self-closing | Single account without a user-management surface |
| 2026-10-12 | Day boundary configurable (`day_start_hour`) | Night owls must not get "wrong day" diaries |
| 2026-10-12 | Diary = daily hub; new Health section for weight/food/height; thoughts + sleep folded into diary | One page per daily rhythm; weight and eating are slow signals, not daily journal material |
| 2026-10-12 | **My rhythm** habits in the diary: user-defined practices by day part, tap-to-check, streaks + last-7-dots; +1 💎 per habit/day | The diary must *create* the daily rhythm and make habits observable, not just record text |
| 2026-10-13 | **Act on Today, reflect in Diary**: quick actions + habits + thoughts + weekly insights moved to the cockpit; diary becomes a time-staged, autosaving check-in; grounding playable; placeholders removed | Actions were buried inside the diary form; observation had no payoff; dead UI erodes trust |
| 2026-10-13 | **Removed habits + thoughts entirely**; introduced **day sealing** (+5 💎, evening review required, read-only after) and the **Days** section to revisit any past day | One daily artifact (the check-in) beats scattered trackers; a sealed, kept day is the product's emotional core |
| 2026-10-13 | **Freeze window replaces seal-locking**: days are editable until 12:00 PM the next day (user timezone), then frozen; seal = completion mark only; Days list shows every day | Late-night and next-morning fixes are real life; the freeze is the true time capsule |
