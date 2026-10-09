# FlippyFloppy

[![Made with AI](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)

A PC-flipping inventory and profit tracker, migrated from the original Flutter + Supabase app into a full-stack web app.

**Live demo:** https://daneymeister.github.io/flippyfloppy/ (server-less build with sample data; the login is shared with the grader separately)

**Demo video:** [watch on Google Drive](https://drive.google.com/file/d/1atmu6ZtHRsydfHFN4Duwi4CJVNxt2SwM/view?usp=sharing): a walkthrough of the app and its code.

> **Flippy** — buy, flip, sell. **Floppy** — a floppy disk: the most recognizable piece of obsolete PC hardware there is, and a thing whose one job was holding onto data that mattered. This app is that, for a PC flipper's business — the record of every purchase, sale, and profit that would otherwise get lost.

## 1. Overview

FlippyFloppy is for someone who buys used PCs and parts, then resells them either as complete builds or as individual components. It records every purchase and what each part cost. It follows each part through its statuses (selling, sold, tester, collection, in use, defective). It records sales, including several parts sold together as one build. It also works out revenue, expenses and net profit, both per purchase and per month.

It is a single-user app: one owner logs in and manages their own records.

- **Client**: React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router
- **Server**: Express 4 (TypeScript) + `pg` (raw SQL, no ORM) + JWT auth
- **Database**: PostgreSQL

## 2. Setup and installation

### Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20.19+ or 22.12+ (developed on 24.14) | Vite 8 needs one of these versions |
| npm | ships with Node | |
| PostgreSQL | 13 or newer | The schema uses `pgcrypto`'s `gen_random_uuid()` |
| Git | any | |

### Get the code

```bash
git clone https://github.com/DaneyMeister/flippyfloppy.git
cd flippyfloppy
```

The repository root contains `client/` and `server/`.

### Create the database

Open `psql` as the `postgres` superuser and run:

```sql
CREATE USER flippyfloppy WITH PASSWORD 'flippyfloppy';
CREATE DATABASE flippyfloppy OWNER flippyfloppy;
\c flippyfloppy
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

The migration also runs `CREATE EXTENSION IF NOT EXISTS pgcrypto`. Creating the extension here as the superuser means the migration still works when the `flippyfloppy` user isn't allowed to create extensions.

### Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### Environment and configuration

Copy the example files, then edit them:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`**

| Variable | Example | What it is |
| --- | --- | --- |
| `PORT` | `4000` | Port the API listens on |
| `DATABASE_URL` | `postgres://flippyfloppy:flippyfloppy@localhost:5432/flippyfloppy` | Postgres connection string |
| `DATABASE_SSL` | *(empty)* | Leave empty locally. Set to `true` for a hosted database that requires SSL (Render, Supabase, Neon) |
| `JWT_SECRET` | `change-this-to-a-long-random-string` | Secret used to sign login tokens. Use a long random value |
| `AUTH_USERNAME` | `admin` | The one username allowed to log in |
| `AUTH_PASSWORD_HASH` | `$2a$10$...` | bcrypt hash of the login password (see below) |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Origin allowed by CORS; must match where the client runs |
| `TRUST_PROXY` | *(empty)* | Leave empty locally. Set to `1` when the API is hosted behind a proxy (e.g. Render), so the login rate limit sees each visitor's real address |

To generate `AUTH_PASSWORD_HASH`, run this inside `server/` after `npm install`, replacing `yourPassword`:

```bash
node -e "console.log(require('bcryptjs').hashSync('yourPassword', 10))"
```

Paste the output into `.env`. You log in with the plain password, not with the hash.

**`client/.env`**

| Variable | Example | What it is |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:4000` | Base URL of the API |

Never commit real `.env` files. They are listed in `.gitignore`, and only the `.env.example` placeholders are in the repository.

### Set up the database schema

```bash
cd server
npm run migrate
```

This command applies every `.sql` file in `server/src/db/migrations/` in order, inside a transaction. It records each applied file in a `schema_migrations` table, so running it again is safe. Expected output:

```
Applying migration: 001_init.sql
All migrations applied.
```

### Seed the sample data

```bash
cd server
npm run seed
```

This command loads `server/src/db/seed.sql`: **22 purchase groups, 147 items and 35 expenses** of made-up data, the same size as a real season of flipping. It covers every feature:
- all 4 group types (PC Set 1–6, System Unit 1–6, Bundle Set 1–6, plus the Bought Components, Defective Items, Extra Peripherals and Collection Set buckets)
- all 6 statuses: 97 sold, 39 selling, 3 tester, 2 using, 4 defective, 2 collection
- 5 builds sold together as one sale
- sales in every month from March to September 2026
- 26 part names sold more than once, for Price Index

The Dashboard then shows ₱255,170 in expenses, ₱296,800 in revenue and **+₱41,630 net profit**. No real people are in it: sellers are platforms (Shopee, FB Marketplace…), buyers are a first name and an initial, and listing links go to `example.com`. Every row has a fixed ID, so running it twice adds nothing the second time. Expected output:

```
Sample data loaded.
```

You can skip this step and start with an empty database, adding your first purchase from the **Acquisition** page.

`npm run import-data` is a separate, one-time tool I used to move my real records over from the old Supabase app. It reads a `migration_data/` folder that holds real buyer names, so that folder is **not** committed, and the command does nothing useful on a fresh clone. Use `npm run seed` instead.

## 3. How to run it

Start the API and the client in two terminals.

```bash
# terminal 1
cd server
npm run dev
```

You should see `FlippyFloppy API listening on http://localhost:4000`. To check it, open http://localhost:4000/health, which returns `{"ok":true}`.

```bash
# terminal 2
cd client
npm run dev
```

Open **http://localhost:5173**. You are redirected to the **login screen** (FlippyFloppy logo and a username/password form). Sign in with `AUTH_USERNAME` and the password you hashed. After logging in you land on the **Dashboard**.

For a production build, run `npm run build && npm start` in `server/` and `npm run build` in `client/`, which writes static files to `client/dist/`.

### Other ways to run it

**With Docker (database + API in one command).** Copy the top-level `.env.example` to `.env`, fill it in (keep the single quotes around `AUTH_PASSWORD_HASH`), then:

```bash
docker compose up --build
```

This starts PostgreSQL and the API on http://localhost:4000, creates the tables and loads the sample data. The database is only reachable from the API container. Start the client as in terminal 2 above. *These Docker files have not been tested yet: Docker was not installed on the machine they were written on.*

**Server-less mode (no server at all).** The client can run on its own, with its API and the same sample data built into the browser. Changes are saved only in that browser. It still has one login account, like the real app. Set it in `client/.env` (see `client/.env.example`):

| Variable | Example | What it is |
| --- | --- | --- |
| `VITE_DEMO_MODE` | `true` | Turns this mode on |
| `VITE_DEMO_USERNAME` | `admin` | The one username allowed to log in |
| `VITE_DEMO_PASSWORD_SHA256` | `5e88489…` | SHA-256 of the password (generate with the command in `client/.env.example`) |

Then run `npm run dev` in `client/`.

The workflow in `.github/workflows/deploy-pages.yml` publishes this build to GitHub Pages on every push to `main`. One-time setup:
1. In the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.
2. In **Settings → Secrets and variables → Actions**, add the secrets `DEMO_USERNAME` and `DEMO_PASSWORD_SHA256`.

Pages on a private repository needs a paid GitHub plan. The password hash ends up in the public site's code, so use a password you don't use anywhere else.

## 4. Features and usage

### Screens

| Route | Screen | What you do there |
| --- | --- | --- |
| `/login` | Login | Sign in; the token is kept for 7 days |
| `/` | Dashboard | See the totals (expenses, revenue, net profit, value of stock still for sale, number of items for sale) and a summary for each purchase group |
| `/inventory` | Inventory | Search all items by name, category or group. Change an item's status, edit or delete an item, or open a group to see its items and expenses and edit it |
| `/acquisition` | Acquisition | Record purchases, in one of two modes (below). The group name fills itself in with the next number, e.g. "PC Set 7" |
| `/sell-build` | Sell Build | Choose items that are still for sale, set a sold price for each, and record the buyer and date |
| `/sold-items` | Sold Items | Sales history; a sale can be returned from here |
| `/monthly-summary` | Monthly Summary | Expenses, revenue, profit and top category for a chosen month |
| `/price-index` | Price Index | Search past sales by keyword (e.g. "RTX 3060"); results update as you type, to help price new listings |

The account menu (the avatar in the top-right corner) holds the light/dark theme toggle and Log out. While data loads, every screen shows a shimmering skeleton of its own layout. On phones, the tables (Inventory, Monthly Summary, Price Index) turn into stacked cards; Inventory stays as cards, two per row, up to laptop width. Price Index searches as you type.

### Main flow: buy → list → sell → review

1. **Record a purchase.** Go to **Acquisition**. Choose one of the two modes:
   - **Batch Purchase** is for buying a PC set or a bundle. Pick the group type, and the name fills itself in with the next free number (with PC Set 1–6 already there, choosing "PC Set" suggests "PC Set 7"; type over it to use your own name). Enter the date, total price paid and seller. Add any extra expenses, such as shipping or cleaning. Then list each component with its category, status and assigned cost. Everything is saved together in one database transaction.
   - **Quick Add** is for a single part. It goes into a shared bucket group such as "Bought Components", and that group's base cost is recalculated automatically.
2. **Manage stock.** On **Inventory**, set each item's status. SELLING means it is for sale; TESTER, COLLECTION, USING and DEFECTIVE are the other options. You can also adjust costs or listed prices and add notes or a listing URL.
3. **Sell.** On **Sell Build**, pick one or more SELLING items, enter a sold price for each, and add the buyer name and sale date. All the picked items are marked SOLD together.
4. **Undo a sale** if the buyer returns something. On **Sold Items**, return the sale and the items go back to SELLING.
5. **Review.** **Dashboard** shows totals over all time, and **Monthly Summary** shows one month at a time.

### API

Every endpoint except `/health` and `/api/auth/login` requires an `Authorization: Bearer <token>` header. A missing or invalid token returns `401`.

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/health` | Checks that the API is up |
| POST | `/api/auth/login` | `{ username, password }` → `{ token }` |
| GET | `/api/groups` | List all purchase groups |
| GET | `/api/groups/:id` | One group with its expenses |
| PATCH | `/api/groups/:id` | Update a group's name, type, date, base cost or seller |
| GET | `/api/items` | List all items, each with its group |
| GET | `/api/items/:id` | One item |
| POST | `/api/items` | Add one item to an existing group |
| POST | `/api/items/batch` | Create a group together with its expenses and components (Batch Purchase) |
| POST | `/api/items/quick-add` | Add one item to a shared bucket group (Quick Add) |
| POST | `/api/items/sell-build` | `{ itemSoldPrices, buyerName, saleDate, listingUrl? }`: mark items SOLD |
| POST | `/api/items/return-sale` | `{ itemIds }`: put sold items back to SELLING |
| PATCH | `/api/items/:id` | Update an item's fields |
| DELETE | `/api/items/:id` | Delete an item |
| POST | `/api/expenses` | `{ groupId, expenses: [{ category, amount, itemId? }] }`: add expenses to a group |
| DELETE | `/api/expenses/:id` | Delete an expense |
| GET | `/api/analytics/dashboard` | Totals plus a summary for each group |
| GET | `/api/analytics/monthly?year=2026&month=9` | Report for one month |
| GET | `/api/analytics/price-lookup?q=rtx` | Past sales that match a keyword |

**Errors.** Every error comes back as `{ "error": "message" }`:

| Status | When |
| --- | --- |
| `400` | The request body fails validation (the message says which field and why), or isn't valid JSON |
| `401` | No token, an expired token, or a wrong username/password on login |
| `404` | The record doesn't exist, or the id in the URL isn't a valid id |
| `413` | The request body is larger than 100 KB |
| `429` | 10 wrong logins from one address within 15 minutes; login is paused for the rest of that window |
| `500` | A server or database failure. The message is generic; the details only go to the server log |

### Security

- **Login:** one account from `server/.env`, checked against a bcrypt hash. A JWT lasts 7 days, and failed logins are rate-limited (see `429` above).
- **Server-side validation** (`server/src/validation.ts`) on every request that changes data:
  - length limits: names 120, categories 40, buyer/seller 100, notes 1000, URLs 500 characters
  - money from 0 to ₱10,000,000
  - statuses, group types and dates must be real ones
  - links must start with `http(s)://`
  - the PATCH routes reject fields they don't know
- **SQL:** every query uses `$1` placeholders. The only dynamic SQL is the list of columns to update, which comes from a fixed allowlist.
- **Headers:** `helmet` sets standard security headers and hides `X-Powered-By`. CORS allows only `CLIENT_ORIGIN`.
- **Dependencies:** `npm audit` reports 0 vulnerabilities in both `server/` and `client/` (last run Oct 9, 2026).
- The full checklist is in [`SECURITY-CHECKLIST.md`](SECURITY-CHECKLIST.md) and [`docs/06-security-and-privacy.md`](docs/06-security-and-privacy.md).

### Privacy

The app stores, for the owner's own records only: buyer names, seller names, sale dates, prices and listing links. It doesn't collect anything about visitors, has no analytics or tracking, and shares nothing with anyone. The login screen says this too. The sample data in this repository is invented, and the owner's real records never leave their own database.

### Data model

The full schema is in `server/src/db/migrations/001_init.sql`.

- `item_groups` is a purchase batch or bucket: name, type (`PC Set`, `System Unit`, `Bundle Set`, `Individual`), purchase date, base cost and seller.
- `inventory_items` is one component or build. Each item belongs to a group and stores its status, assigned cost, listed and sold prices, buyer, sale date and notes.
- `group_expenses` holds extra cost lines for a group. An expense can optionally be linked to one item.

## 5. Project structure

```
final_project/
├── .github/workflows/
│   └── deploy-pages.yml         Builds the demo and publishes it to GitHub Pages
├── client/                      React + Vite frontend
│   ├── public/                  Logo and favicons
│   └── src/
│       ├── App.tsx              Routes (public /login, everything else protected)
│       ├── api/
│       │   ├── client.ts        fetch wrapper: adds the JWT, sends you to /login when the session expires
│       │   ├── mockApi.ts       Built-in API for the server-less (GitHub Pages) build
│       │   └── seed.json        Sample data for that build (same as seed.sql)
│       ├── context/             AuthContext, InventoryContext (shared data), ThemeContext
│       ├── pages/               One file per screen (Dashboard, Inventory, Acquisition, ...)
│       ├── components/          Layout, modals (EditItem, EditGroup, GroupDetail), Skeletons (loading screens), form and badge helpers
│       ├── utils/               Formatting (currency, local dates), sorting, next group name (groupName.ts)
│       └── types.ts             Shared TypeScript types
├── server/                      Express API
│   ├── Dockerfile               API image used by compose.yml
│   └── src/
│       ├── index.ts             App setup, helmet, CORS, route mounting, error handler
│       ├── middleware/auth.ts   JWT check (requireAuth)
│       ├── validation.ts        Server-side input checks and length limits for every route
│       ├── routes/              HTTP layer: runs the checks, returns status codes, login rate limit
│       ├── services/            SQL queries and business logic (cost recalculation, sales, analytics)
│       ├── db/
│       │   ├── migrations/      SQL schema files
│       │   ├── migrate.ts       Migration runner (npm run migrate)
│       │   ├── seed.sql         Made-up sample data
│       │   ├── seed.ts          Seed runner (npm run seed)
│       │   ├── import-supabase-data.ts  One-time import from the old app (npm run import-data)
│       │   └── pool.ts          pg connection pool (returns DATE columns as plain YYYY-MM-DD)
│       └── types.ts
├── docs/                        Course documents (proposal, mockup, design system, security...) and screenshots
├── journal/                     Weekly reflection journal
├── REPORT_*.md                  Weekly increment reports
├── SECURITY-CHECKLIST.md        Security checklist, row by row with evidence
├── compose.yml                  PostgreSQL + API in Docker
├── .env.example                 Settings for compose.yml
├── AI-USAGE.md                  How AI was used to build this
└── README.md
```

## 6. Screenshots

All screenshots use the sample data from `npm run seed`, plus two purchases added while testing Acquisition: a Batch Purchase ("PC Set 7", 3 items) and one Quick Add item in Bought Components. That is why they show 23 groups, ₱268,670 in expenses, +₱28,130 net profit and 43 items for sale, instead of the 22 groups, ₱255,170, +₱41,630 and 39 items a fresh seed gives. Revenue (₱296,800) is the same, because neither purchase has been sold. Dark mode is the default; the last row shows light mode.

### Desktop

| Login | Dashboard |
| --- | --- |
| ![Login](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Inventory | Sold Items |
| --- | --- |
| ![Inventory](docs/screenshots/inventory.png) | ![Sold Items](docs/screenshots/sold-items.png) |

| Acquisition: Batch Purchase | Acquisition: Quick Add |
| --- | --- |
| ![Acquisition, Batch Purchase](docs/screenshots/acquisition_batch-purchase.png) | ![Acquisition, Quick Add](docs/screenshots/acquisition_quick-add.png) |

| Sell Build | Monthly Summary |
| --- | --- |
| ![Sell Build](docs/screenshots/sell-build.png) | ![Monthly Summary](docs/screenshots/monthly-summary.png) |

| Price Index | Light mode |
| --- | --- |
| ![Price Index](docs/screenshots/price-index.png) | ![Dashboard in light mode](docs/screenshots/light-mode.png) |

### Tablet and phone

On smaller screens the sidebar becomes a menu button, and the tables turn into cards.

| Screen | Tablet | Phone |
| --- | --- | --- |
| Login | <img src="docs/screenshots/login_tablet.png" alt="Login on tablet" width="360"> | <img src="docs/screenshots/login_phone.png" alt="Login on phone" width="180"> |
| Dashboard | <img src="docs/screenshots/dashboard_tablet.png" alt="Dashboard on tablet" width="360"> | <img src="docs/screenshots/dashboard_phone.png" alt="Dashboard on phone" width="180"> |
| Inventory | <img src="docs/screenshots/inventory_tablet.png" alt="Inventory on tablet" width="360"> | <img src="docs/screenshots/inventory_phone.png" alt="Inventory on phone" width="180"> |
| Acquisition: Batch Purchase | <img src="docs/screenshots/acquisition_batch-purchase_tablet.png" alt="Batch Purchase on tablet" width="360"> | <img src="docs/screenshots/acquisition_batch-purchase_phone.png" alt="Batch Purchase on phone" width="180"> |
| Acquisition: Quick Add | <img src="docs/screenshots/acquisition_quick-add_tablet.png" alt="Quick Add on tablet" width="360"> | <img src="docs/screenshots/acquisition_quick-add_phone.png" alt="Quick Add on phone" width="180"> |
| Sell Build | <img src="docs/screenshots/sell-build_tablet.png" alt="Sell Build on tablet" width="360"> | <img src="docs/screenshots/sell-build_phone.png" alt="Sell Build on phone" width="180"> |
| Sold Items | <img src="docs/screenshots/sold-items_tablet.png" alt="Sold Items on tablet" width="360"> | <img src="docs/screenshots/sold-items_phone.png" alt="Sold Items on phone" width="180"> |
| Monthly Summary | <img src="docs/screenshots/monthly-summary_tablet.png" alt="Monthly Summary on tablet" width="360"> | <img src="docs/screenshots/monthly-summary_phone.png" alt="Monthly Summary on phone" width="180"> |
| Price Index | <img src="docs/screenshots/price-index_tablet.png" alt="Price Index on tablet" width="360"> | <img src="docs/screenshots/price-index_phone.png" alt="Price Index on phone" width="180"> |
| Light mode | <img src="docs/screenshots/light-mode_tablet.png" alt="Dashboard in light mode on tablet" width="360"> | <img src="docs/screenshots/light-mode_phone.png" alt="Dashboard in light mode on phone" width="180"> |

## 7. Known issues and next steps

**Fixed in week 2** (Sep 24–27): the async routes that could hang on a database error, the PATCH routes that didn't validate values, Price Index's phone layout, and a bug where **saving any edit moved a purchase date one day earlier**. See [`REPORT_9-27-26.md`](REPORT_9-27-26.md).

**Live demo** (Oct 2026): the server-less build runs on GitHub Pages at **https://daneymeister.github.io/flippyfloppy/**, with the sample data built in and one login account. The login was tested there. The full app, with the Express API and PostgreSQL, runs locally (section 3) and isn't hosted yet.

**Known issues**
- **Docker files are untested.** `compose.yml` and `server/Dockerfile` were written on a machine without Docker.
- **No automated tests.** Everything has been checked by hand, by typecheck/build/lint, and with scripts run against a test copy of the server.
- **The login rate limit is kept in memory.** Restarting the server resets it.
- **The full app isn't hosted.** Only the server-less demo is online. Its changes are saved in the visitor's own browser, not in a shared database.
- **The server-less build's password hash is public.** That build has no server, so the SHA-256 of its password ships inside the site's code. Use a password that isn't used anywhere else.
- **Single user only.** The one login comes from env vars; there are no user accounts in the database.
- **Token stored in `localStorage`.** It lasts 7 days and there is no way to revoke it early.

**Next steps**
1. Host the full app: a hosted Postgres database, the API and the static client. The code is ready for it: set `DATABASE_SSL=true`, `TRUST_PROXY=1`, `CLIENT_ORIGIN` and `VITE_API_URL` (section 2).
2. Add tests for the flows where costs and money change: batch purchase, quick add, sell build, return sale.
3. Keep the login rate limit in the database (or a store like Redis) so it survives restarts.
4. Test the Docker setup on a machine that has Docker.

## AI usage

Built with heavy AI assistance from **Claude** (Claude Code): the AI generated most of the code, while I directed the migration from my original Flutter app, tested every change against my real data, and caught what it got wrong. The full account of what the AI did, where it was wrong, and which parts I wrote is in [AI-USAGE.md](AI-USAGE.md).
