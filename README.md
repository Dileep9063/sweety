# 🍬 Sweety – Blood Glucose Tracker

A small web app where a diabetes patient records up to **4 blood glucose readings a day**
(Morning fasting, After breakfast, After lunch, After dinner) and views **daily, month-to-date
and previous-month reports**.

**Stack:** Node.js + Express · PostgreSQL (`pg`, raw SQL) · React (Vite) · JWT + bcrypt · Jest/Supertest · Vitest/React Testing Library

## Features
- Sign up / log in (passwords hashed with bcrypt, JWT auth). Users only ever see their own readings.
- Add, view, edit, delete readings with all 5 validation rules (checked in the UI **and** in the API).
- Reports: highest, lowest, average (1 decimal) and count, with friendly empty states.
  Daily (also lists each reading), month-to-date, and previous month.
- Bonus included: `docker-compose.yml` for PostgreSQL, frontend tests with React Testing Library.

## Prerequisites
Node.js 18+ and PostgreSQL 14+ (or Docker).

## 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

## 2. Set up the database
**Option A: Docker (easiest)**
```bash
docker compose up -d        # from the project root; creates `sweety` and `sweety_test`
```
**Option B: local PostgreSQL**
```bash
createdb sweety
createdb sweety_test
```

Then configure the server and create the tables:
```bash
cd server
cp .env.example .env        # edit DATABASE_URL and JWT_SECRET if needed
npm run migrate             # creates the tables
npm run seed                # creates demo user: demo@sweety.com / password123 (+ ~45 days of readings)
```
(Optional) `cp client/.env.example client/.env`. The default needs no changes in development.

## 3. Run the app
Use two terminals:
```bash
cd server && npm run dev    # API on http://localhost:5000
cd client && npm run dev    # UI  on http://localhost:5173
```
Open http://localhost:5173 and log in with the demo account, or sign up.

## 4. Run the tests
```bash
cd server && npm test       # needs the sweety_test database
cd client && npm test
```
Backend tests cover: password hashing, auth, all validation rules (including the edit edge case),
per-user data isolation, and the report date ranges (including January → December).
The server tests truncate the tables in `sweety_test` (never your dev database).

## API overview
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` → `{ user, token }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ user, token }` |
| GET | `/api/readings?date=YYYY-MM-DD` | List my readings (date optional) |
| POST | `/api/readings` | `{ date, slot, value }` |
| PUT | `/api/readings/:id` | Edit a reading |
| DELETE | `/api/readings/:id` | Delete a reading |
| GET | `/api/reports?date=YYYY-MM-DD` | Daily + month-to-date + previous-month reports |

All `/readings` and `/reports` routes need `Authorization: Bearer <token>`.
Slot keys: `morning`, `after_breakfast`, `after_lunch`, `after_dinner`.

## Screenshots
_Add screenshots / a link to your 2–3 minute screen recording here._

## Notes

### Assumptions
- A date is a plain `YYYY-MM-DD` string end to end (never a JS `Date`), so there are no timezone shifts.
- "Future date" is checked against the **server's local date**. If the server's timezone differs from the user's, there can be a few hours' mismatch around midnight.
- When a day already has 4 readings, the "max 4" message takes priority over the "duplicate slot" message (all 4 slots are taken by then).
- Editing a reading ignores itself when checking the rules, so changing only the value of an existing reading works.
- A reading that belongs to another user returns **404** (not 403), so IDs are not revealed.
- "Previous month" is relative to the selected date (selected 15 Oct → 1–30 Sep; selected in January → previous December).
- Reports cannot be requested for a future date.
- The "max 4 per day" rule is made race-safe with a row lock on the user inside a transaction; the `UNIQUE (user_id, reading_date, slot)` constraint and `CHECK`s in the schema are a second safety net.
- JWT is stored in `localStorage` for simplicity.

### What I would improve with more time
- Store the user's timezone and use it for the "future date" check.
- Httponly-cookie auth + refresh tokens, rate limiting on login, email verification and password reset.
- Pagination on `GET /readings`, a line chart of the month (Recharts), and Redis caching for reports.
- A proper migrations tool (e.g. node-pg-migrate) instead of one `schema.sql`.
- More tests: component tests for the pages, and end-to-end tests (Playwright).
- Doctor role to view assigned patients' reports; a daily reminder job (BullMQ).
