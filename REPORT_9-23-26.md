# Weekly Increment Report

## Week of: August 27 – September 23, 2026

## What changed this week

**Migration and project setup**
- Started FlippyFloppy, a web rebuild of my original Flutter + Supabase PC-flipping tracker. The client uses React + Vite + TypeScript + Tailwind v4. The server uses Express (TypeScript) with raw SQL through `pg` and no ORM. The database is PostgreSQL.
- Wrote the schema in `server/src/db/migrations/001_init.sql`:
  - `item_groups` holds purchase batches.
  - `inventory_items` holds components and builds.
  - `group_expenses` holds extra costs tied to a group or item.
  - Two Postgres enums (`item_status`, `item_group_type`) plus indexes on the foreign keys and on `status`.
- Wrote a migration runner (`npm run migrate`).
- Wrote `import-supabase-data.ts` (`npm run import-data`), which moves my real data out of Supabase: 22 groups, 147 items and 35 expenses, exported to `migration_data/`.
- Put the project under git on Sept 16. I set up `.gitignore` so `.env` files, `dist/` and `migration_data/` (it contains buyer names) are never committed.

**Backend: REST API**
- Auth: `POST /api/auth/login` checks one username/password against a bcrypt hash stored in env vars and returns a JWT. The `requireAuth` middleware protects every other `/api/*` route.
- Groups: `GET /api/groups`, `GET /api/groups/:id`, `PATCH /api/groups/:id`. When costs change, the group's base cost is recalculated.
- Items:
  - `GET /api/items` and `GET /api/items/:id`
  - `POST /api/items` adds one item to a group
  - `POST /api/items/batch` saves a whole purchase in one request: the group, its components and its expenses
  - `POST /api/items/quick-add` adds a single part to a shared "bought components" group
  - `POST /api/items/sell-build` sells several parts together as one build to a buyer
  - `POST /api/items/return-sale` reverses a sale
  - `PATCH /api/items/:id` and `DELETE /api/items/:id`
- Expenses: `POST /api/expenses` and `DELETE /api/expenses/:id`.
- Analytics:
  - `GET /api/analytics/dashboard` returns the summary figures.
  - `GET /api/analytics/monthly` returns the report for one month.
  - `GET /api/analytics/price-lookup` searches past prices by keyword.
- Code is split into routes (validation and HTTP status codes) and services (SQL). Endpoints return 400 on missing fields and 404 when a record does not exist.

**Frontend: screens**
- Login page. The JWT is stored in localStorage and sent as a Bearer header. A 401 response clears it and redirects to `/login`.
- Protected routes are wrapped in a shared `Layout` with navigation and a light/dark theme toggle (`ThemeContext`).
- Dashboard (`/`): summary cards for the business.
- Inventory (`/inventory`): list of all items with status badges and sorting. It opens:
  - Edit Item modal
  - Edit Group modal
  - Group Detail modal
- Acquisition (`/acquisition`): logs a new purchase batch with its components and extra expenses.
- Sell Build (`/sell-build`): picks parts, sets a sold price for each, and records the buyer and date.
- Sold Items (`/sold-items`): sales history.
- Monthly Summary (`/monthly-summary`): numbers for a chosen month.
- Price Index (`/price-index`): looks up what similar parts cost or sold for before.
- Shared components: `FormField`, `StatusBadge`, `StatusSelect`, `SummaryCard`. Shared helpers: `utils/format.ts` for peso/date formatting and `utils/sort.ts`.
- On Sept 3 I made a second pass on the Dashboard, Inventory, Group Detail modal, Layout, Login page and summary cards.
- App name, logo and favicons added.

## Why

I run a small business buying used PCs and parts, then selling them as whole builds or individual parts. The original Flutter + Supabase app worked, but it depended on a hosted backend I did not write. For the final project I wanted a full stack I own and understand: my own Express API, my own SQL schema, and a React front end.

The main thing the app does is track profit correctly. A group's cost is shared across its items, and extra expenses are added on top. Items move between statuses (SELLING, SOLD, TESTER, COLLECTION, USING, DEFECTIVE). A build is sold as several items at once. The endpoints and screens above exist to keep those numbers right.

## What broke or what I got stuck on

- **Async errors in Express 4.** The GET routes in `groups.ts`, `items.ts` and `analytics.ts` are `async` but have no `try/catch`. Express 4 does not send rejected promises to the error handler. If the database is down, those requests hang or crash the server instead of returning a 500. The POST, PATCH and DELETE routes do have try/catch.
- **Mapping the Supabase data.** The exported JSON had to match the new enums (`item_status`, `item_group_type`) and keep its original UUIDs. Otherwise items would lose their `group_id` links to their groups and expenses would lose their links to groups and items.
- **Keeping costs consistent.** When items are added or removed or expenses change, the group's `base_cost` has to be recalculated (`recalculateGroupBaseCost`). The same applies when a sale is reversed with `return-sale`. Getting that right took more work than the CRUD itself.
- **Setup docs.** `README.md` refers to a "Manual Steps Required by User" section that does not exist yet.
- No automated tests yet, so I have only checked the app by clicking through it. Both server and client currently typecheck with no errors.

## What is left

- Add error handling to the async GET routes, or upgrade to Express 5, which handles async errors itself.
- Fill in the missing setup section of the README, or remove the reference to it.
- Deploy: host PostgreSQL and the API, host the client, and set `CLIENT_ORIGIN` and `VITE_API_URL` for production.
- Run the Supabase import against the deployed database and check the totals against the old app.
- Test the tricky flows from start to finish: batch acquisition, sell build, return sale, and deleting an item that has expenses.
- Check the layout on mobile, and add empty and loading states to the pages.
- Commit regularly from now on. There is only one commit so far (Sept 16), so the git history does not yet show the work week by week.
