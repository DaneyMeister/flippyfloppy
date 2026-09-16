# FlippyFloppy

A PC-flipping inventory and profit tracker, migrated from the original Flutter + Supabase app into a full-stack web app.

> **Flippy** — buy, flip, sell. **Floppy** — a floppy disk: the most recognizable piece of obsolete PC hardware there is, and a thing whose one job was holding onto data that mattered. This app is that, for a PC flipper's business — the record of every purchase, sale, and profit that would otherwise get lost.

- **Client**: React + Vite + TypeScript + Tailwind CSS v4
- **Server**: Express (TypeScript) + `pg` (raw SQL, no ORM)
- **Database**: PostgreSQL

## Project layout

```
final_project/
├── client/   React + Vite frontend
└── server/   Express API + SQL migrations
```

## Data model

- `item_groups` — a purchase batch/bucket (base cost + type + purchase date)
- `inventory_items` — a component or build, belongs to a group, tracks status/cost/sale info
- `group_expenses` — additional cost line items tied to a group (and optionally one item)

See `server/src/db/migrations/001_init.sql` for the full schema.

## Setup

See **Manual Steps Required by User** below for the exact commands. In short:

1. Install PostgreSQL and create a database + user.
2. Copy `server/.env.example` to `server/.env` and fill in `DATABASE_URL`, `JWT_SECRET`, `AUTH_USERNAME`, `AUTH_PASSWORD_HASH`.
3. `cd server && npm install && npm run migrate && npm run dev`
4. Copy `client/.env.example` to `client/.env` (defaults are fine for local dev).
5. `cd client && npm install && npm run dev`
6. Open http://localhost:5173 and log in with the username/password you configured.

## Auth

Single-user login: one username/password pair set via server env vars, verified with bcrypt, and a JWT is issued and stored client-side for subsequent API calls.
