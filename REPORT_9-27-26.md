# Weekly Increment Report

## Week of: September 24 – 27, 2026

## What changed this week

**Data: no more real customer information**
- Replaced every real record in my local database with an invented dataset the same size as my real one: 22 groups, 147 items and 35 expenses.
  - Sellers are platforms (Shopee, FB Marketplace, …), buyers are a first name and an initial ("Marco R."), and listing links go to `example.com`.
  - It exercises every feature: all 4 group types, all 6 statuses, the 4 shared bucket groups, 5 builds sold as one sale, sales in every month from March to September 2026, and 26 part names sold more than once for Price Index.
  - Priced the way flipping really works (each part's share of a batch is about 50–68% of its resale price), so the Dashboard shows a realistic **+₱41,630 net profit** instead of a loss.
- The same data is in `server/src/db/seed.sql` (`npm run seed`) and `client/src/api/seed.json` (the server-less build), generated together so they always match.
- Wiped the local database and loaded the new data in one transaction, then checked that 0 real rows and 0 real names were left. My real data is still in Supabase.

**Features**
- **Auto-numbered group names** (`client/src/utils/groupName.ts`): choosing a Group Type on Acquisition → Batch Purchase fills in the next number, e.g. "PC Set 7" when PC Set 1–6 exist. Gaps aren't reused, changing the type updates it, typing your own name keeps it, and clearing the box brings the suggestion back.
- **Skeleton loading screens** (`client/src/components/Skeletons.tsx` + a shimmer in `index.css`) on Dashboard, Inventory, Monthly Summary, Price Index, Sold Items, Sell Build and Acquisition. Each copies its screen's real layout, works in light and dark mode, stays still for "reduce motion", and is announced to screen readers.
- **Price Index phone layout:** the sale history is a stacked card list on phones instead of a table that scrolled sideways.
- **Single login account in the server-less build:** removed the "demo mode" banner and the "type any username" hint. The GitHub Pages build now checks one username and a SHA-256 of the password, taken from repository secrets.
- **Liquid assets:** confirmed the Dashboard total already counts only SELLING items (at their assigned cost), so no change was needed.

**Security (server)**
- Every route now has error handling. With the database down, pages answer 500 in about 0.1 s instead of hanging. A malformed id in a URL gives 404 instead of a database error.
- New `server/src/validation.ts`: every request that changes data is checked on the server.
  - Length limits: names 120, categories 40, buyer/seller 100, notes 1000, URLs 500 characters.
  - Money must be a number from 0 to ₱10M.
  - Statuses, group types and dates must be real ones, and listing links must start with http(s)://.
  - The PATCH routes reject unknown fields.
- Added `helmet` (security headers) and `express-rate-limit`: 10 wrong passwords in 15 minutes blocks login from that address. Broken JSON now returns 400 instead of 500.
- `npm audit fix` updated Express to 4.22.3 (a `qs` advisory): **0 vulnerabilities** in server and client.

**Bugs found and fixed**
- **Saving an edit moved the purchase date one day earlier**, every time, even if the date wasn't touched. The `pg` driver turned DATE columns into "local midnight" (UTC+8), which reached the browser as the previous day's UTC date, and the edit forms filled their date boxes from that. Fixed in `server/src/db/pool.ts` (DATE is returned as plain `YYYY-MM-DD`) and with a `toDateInput` helper in `client/src/utils/format.ts`. Saving the same forms three times now keeps every date.
- **A wrong password reloaded the login page** instead of showing "Invalid credentials" (`client/src/api/client.ts`).
- **"Today" defaults used the UTC date**, so Acquisition, Sell Build and Edit Item pre-filled yesterday before 8 AM. They now use the local date.
- **Sold Items and Sell Build flashed "No sales recorded yet" / an empty list** while loading, and Acquisition briefly suggested "PC Set 1". The skeletons fixed all three.

## Why

- **Privacy.** My database, my screenshots and anything I record for the demo were full of real customers' full names. Before the repository goes public, nothing about real people can be in it. An invented dataset the same size as my real one lets me show every feature without exposing anyone.
- **The security checklist.** Week 1's checklist marked server-side validation "No", and the professor's `06-security-and-privacy` list asks for `helmet`, rate limiting on anything that takes a password, length limits and `npm audit`. The async routes that could hang were the top known issue in my week 1 report.
- **Using it for real.** The auto-numbered group names and the date fix are about daily use: naming "PC Set 7" by hand, and a purchase date that quietly moves every time I edit a group, would both cause wrong records. The skeletons and the Price Index phone layout make the app feel finished on a slow connection or a phone.

## What broke or what I got stuck on

- **The date bug was hiding in plain sight.** It was in the app since Aug 27 and only showed up because a test re-saved records with their *own* values and three dates changed. That test ran against my database, so I had to put those three records back (they now match the seed exactly).
- **The first dummy dataset showed a ₱54,620 loss**, because every part's cost was set close to its resale price. That isn't how buying a whole PC and parting it out works, so I repriced it.
- **Seeing "type any username and password" on my login screen.** That hint only belongs to the server-less build. My PowerShell window still had `VITE_DEMO_MODE` set from testing, so my normal app looked broken when it wasn't. I removed the hint and gave the server-less build a single account anyway.
- **Screenshots.** The six in `docs/screenshots/` showed real buyer names. I retook them from the new data at the end of the week, before committing.
- **Still untested:** the Docker files (no Docker on my laptop) and the GitHub Pages workflow (never pushed, so it has never run).
- **No automated tests yet.** Everything was checked by hand, by typecheck/build/lint, and with scripts run against a separate test copy of the server.

## What is left

- Improve the UI based on tips and tricks from online.
- Put the professor's login in my private workspace README.
- Turn on GitHub Pages and add the `DEMO_USERNAME` / `DEMO_PASSWORD_SHA256` secrets, then check the first workflow run's log.
- Deploy the full app (database, API, client) so the demo video can use the deployed site.
- Record the demo video (`docs/05-demo-video.md`).
- Add automated tests for the money flows: batch purchase, quick add, sell build, return sale.
