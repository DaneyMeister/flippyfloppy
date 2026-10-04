# Security checklist

Filled in for FlippyFloppy (`DaneyMeister/flippyfloppy`, then called `DaneyMeister/apsi`) on 2026-09-27, before making the repository public, and updated at the end of week 2 (after the security fixes, Sep 24–27).
Every answer below was checked against the repository and my local setup on that date.

## Secrets and credentials

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 1 | `.env` is gitignored and is not in the repository | Yes | `.gitignore` line 3 is `.env`, and `git ls-files` shows only `client/.env.example` and `server/.env.example` |
| 2 | A `.env.example` with placeholder values only is committed | Yes | `server/.env.example` has `JWT_SECRET=change-this-to-a-long-random-string`, an empty `AUTH_PASSWORD_HASH`, and the same local-dev `DATABASE_URL` the README tells you to create; `client/.env.example` only has `VITE_API_URL=http://localhost:4000` |
| 3 | No connection string, key, token or password is hardcoded in source, comments or commented-out code | Yes | `server/src/db/pool.ts` reads `DATABASE_URL`, and `middleware/auth.ts` and `routes/auth.ts` read `JWT_SECRET`, `AUTH_USERNAME` and `AUTH_PASSWORD_HASH` from `process.env`; `git grep` for `supabase.co`, `anon`, `eyJhbGci` and `apikey` found nothing |
| 4 | Git history is clean: I searched `git log -p` for password, secret, api key and `postgres://` | Yes | Searched `git log -p --all`: the only hits are variable names, the login form, and the placeholder lines in `server/.env.example` |
| 5 | Any credential that was ever committed has been rotated | N/A | No real credential has ever been committed. `.env` was gitignored from the first commit, and the only commit is `5b3fca7` |
| 6 | Production credentials live only in my hosting provider's environment settings | N/A | Not deployed yet; the app only runs locally with `server/.env`. When I deploy I will set the env vars in the host's dashboard |

## GitHub Actions

The project has one workflow, `.github/workflows/deploy-pages.yml`. It builds the server-less client and publishes it to GitHub Pages. It hasn't run yet, because the repository hasn't been pushed since it was added.

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 7 | No secret value is written literally in any workflow YAML file | Yes | `deploy-pages.yml` has no values in it: the only credentials are `${{ secrets.DEMO_USERNAME }}` and `${{ secrets.DEMO_PASSWORD_SHA256 }}` |
| 8 | Secrets are stored in repository Actions secrets and read with `${{ secrets.NAME }}` | Yes | Both are read with `${{ secrets.NAME }}` in the "Build demo" step. I still have to add them in Settings → Secrets and variables → Actions before the first run |
| 9 | No workflow step echoes, dumps or debug-prints a secret, and I opened a recent run's log to confirm | N/A | No step prints anything from `env` (the steps are `npm ci`, `npm run build`, `cp`, and the official Pages actions), but the workflow has never run, so there's no log to open yet. I'll check the first run's log |
| 10 | Uploaded build artifacts contain no `.env`, key file or generated config | Yes | The artifact is only `client/dist` (HTML, JS, CSS, images). No `.env` or key file. On purpose, the JS contains the server-less build's username and the **SHA-256 of its password**, since that build has no server; that password isn't used anywhere else |
| 11 | Third-party actions are pinned to a commit SHA, not a moveable tag | Yes | All five actions (`checkout`, `setup-node`, `configure-pages`, `upload-pages-artifact`, `deploy-pages`) use a full 40-character SHA, with the version tag in a comment |
| 12 | Secret scanning and push protection are enabled on the repository | No | Not turned on yet. I'll enable both in Settings → Code security before making the repository public |

## Database

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 13 | Every query taking user input uses parameters, never string concatenation | Yes | Every value goes in through `$1`, `$2`… placeholders. The two dynamic `UPDATE`s (`updateItem` in `itemsService.ts`, `updateGroup` in `groupsService.ts`) build only the column names, and only from a fixed allowlist in the code. Price lookup passes `%keyword%` as a parameter, not in the SQL |
| 14 | The database is not open to the whole internet, or is reachable only by the app | Yes | Local PostgreSQL 18. `postgresql.conf` has `listen_addresses = '*'`, but `pg_hba.conf` only accepts connections from `127.0.0.1/32` and `::1/128`, so only this machine can connect |
| 15 | The database user the app connects as has only the permissions it needs | Yes | The app connects as `flippyfloppy`, a normal user created with `CREATE USER`, not a superuser. It owns only the `flippyfloppy` database, which it needs so `npm run migrate` can create tables |
| 16 | Seed and sample data is invented, not real people's data | Yes | `server/src/db/seed.sql` and `client/src/api/seed.json` (22 groups, 147 items, 35 expenses) are invented: sellers are platforms, buyers are a first name + initial, links go to `example.com`. I checked them against my real export: none of my real buyer or seller names appear. My local database now holds only this data; the real records are in Supabase and my gitignored `migration_data/` |
| 17 | Debug, seed and reset routes are removed before going public | Yes | `server/src/index.ts` mounts only `/health` (returns `{ ok: true }`), auth, groups, items, expenses and analytics; searching `server/src` for debug, reset, seed and truncate finds nothing |

## Access control

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 18 | The app has an access layer: Cloudflare Zero Trust, an app-level password, or a real login | Yes | Real login: `POST /api/auth/login` checks the password with bcrypt and returns a JWT that expires after 7 days; the client sends it as a Bearer token |
| 19 | If Supabase or Firebase: Row Level Security or security rules are on, and I tested it signed out | N/A | The final project uses my own Express + Postgres, not Supabase. My **old** Supabase project is a different story; see the findings at the bottom |
| 20 | If Zero Trust: tjakoen.s@gmail.com is on the access policy. If an app password: the credentials are in my private workspace `project/README.md` | No | The app uses a login, but I have not yet put the grader's username and password in my private workspace README. To do before submitting |
| 21 | The gate covers every route, including the ones that only change data | Yes | `server/src/index.ts` puts `requireAuth` on `/api/groups`, `/api/items`, `/api/expenses` and `/api/analytics`, which covers every GET, POST, PATCH and DELETE. Only `/health` and `/api/auth/login` are public |
| 22 | The credentials for the gate are environment variables, not in source | Yes | `AUTH_USERNAME`, `AUTH_PASSWORD_HASH` (a bcrypt hash, not the password) and `JWT_SECRET` come from `server/.env` |

## Input and output

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 23 | Input from the user is validated on the server, not only in the browser | Yes | Fixed in week 2. `server/src/validation.ts` checks every request that changes data: types, allowed statuses/group types, real dates, money 0–₱10M, `http(s)://` links, length limits (names 120, notes 1000…), and unknown fields on PATCH. I tested 16 bad requests (e.g. status "SOLDISH", cost −5, a `javascript:` link); all got a 400 |
| 24 | User-supplied text is escaped when rendered, so it cannot inject markup or script | Yes | Everything renders through React JSX, which escapes text; there is no `dangerouslySetInnerHTML` in `client/src`. The listing URL is only shown inside an input box, never as a clickable link |
| 25 | Error responses do not expose stack traces, file paths or connection details | Yes | Every route now has a `try/catch` that logs on the server and sends a fixed message. The error handler in `server/src/index.ts` sends only `{ error: 'Internal server error' }` (or 400/413 for broken or oversized JSON). With the database switched off, I got `{"error":"Failed to load groups"}`, with no details. The only other 500 names the missing env variables, not their values |
| 26 | CORS is not a wildcard on routes that change data | Yes | `cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' })` allows one origin only |

## Repository and privacy

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 27 | No student number, personal email, phone number or home address in the repository or in commit messages | Yes | The files are clean: `git grep` for `@gmail`, phone numbers and `+63` finds nothing. My first commit used to show my personal Gmail. I rewrote its author to my GitHub no-reply address (`130228720+DaneyMeister@users.noreply.github.com`) before going public; it's now `5b3fca7`, with the same files and date. Git now uses the no-reply address, and GitHub is set to block any push that exposes my email |
| 28 | No classmate's personal data in the repository | Yes | No classmate data. Buyer names are only in my local, gitignored `migration_data/`. The code mentions one of my own group names ("Lolo Jhun") in a sort-order comment and rule in `client/src/utils/sort.ts`, which is a group label, not contact details |
| 29 | Dependencies come from official registries, and `node_modules` is gitignored | Yes | All 263 `resolved` URLs in both `package-lock.json` files point to `registry.npmjs.org`; `.gitignore` line 1 is `node_modules/` |
| 30 | Images, fonts and other assets are mine, licensed, or credited | Yes | I generated the logo and favicons myself with an image tool. The fonts (Plus Jakarta Sans, Lexend) are free Google Fonts, the icons are lucide-react (ISC licence), and `client/public/icons.svg` is the unused Vite starter sprite (MIT) |
| 31 | Repository visibility is deliberate, and I checked it after my last push | Yes | It is private for now on purpose: an anonymous request to `api.github.com/repos/DaneyMeister/flippyfloppy` returns 404. I will re-check after rows 20 and 27 are fixed and I make it public |

## Anything I found and fixed

**Week 1 (found):** my old Supabase project is still readable with the public anon key, which means Row
Level Security isn't protecting it. My personal Gmail is the author of my only commit. And the PATCH
routes didn't validate values.

**Week 2 (fixed):**
- **Server-side validation** (row 23) is now on every request that changes data, with length limits.
- Every route has **error handling**, so a database failure answers with a generic 500 instead of hanging.
- **`helmet`** headers are on.
- **Login is rate-limited:** 10 wrong passwords in 15 minutes gives 429.
- **`npm audit`** went from 3 moderate warnings to **0**.
- The **seed data is invented** (row 16), and my local database holds nothing real any more.

**Found and fixed at the end of week 2:**
- **The screenshots:** the six in `docs/screenshots/` showed real customers' full names. I retook them from the sample data.
- **The commit email:** my first commit's author changed from my Gmail to my GitHub no-reply address (row 27).

**Still to do before going public:**
- turn on RLS in (or pause) the old Supabase project
- put the grader's login in my private README (row 20)
- turn on secret scanning and push protection (row 12)
- check the first workflow run's log (row 9)
