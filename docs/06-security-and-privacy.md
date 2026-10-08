# Security and privacy checklist

Work through this **before your first push**, and again before you submit. It is
short, none of it is exotic, and a grader can check most of it in two minutes.

Your repository is public, in your own account, and permanent. That is the point
of it, and it is also why this file exists.

## Before the first push

- [x] `.gitignore` includes `.env`, and `git check-ignore -v .env` confirms it
      ↳ `git check-ignore -v` matches `.env`, `server/.env` and `client/.env` to `.gitignore` line 3
- [x] `git ls-files | grep -iE '\.env$|\.pem$|id_rsa'` prints nothing
      ↳ Prints nothing, for tracked files and for the new files waiting to be committed
- [x] `.env.example` is committed, with **placeholder** values only
      ↳ Three of them (root, `server/`, `client/`): placeholders like `change-this-to-a-long-random-string`, an empty/`paste-the-hash-here` password hash, and the local-dev database URL the README tells you to create
- [x] No connection string, key or password anywhere in the repository,
      including in a screenshot
      ↳ The server reads everything from `process.env`, and `git grep` for keys and tokens finds nothing (see `SECURITY-CHECKLIST.md` rows 3–4). No screenshot shows a credential
- [x] No `student.json`, and no name, student number or email of yours or anyone
      else's
      ↳ No `student.json`. My first commit's author changed from my Gmail to my GitHub no-reply address, and the six screenshots were retaken from the invented sample data

Deleting a file later does **not** remove it from the history. If you commit a
credential, **rotate it first**, at the service, and clean up the history second.
The rotation is the fix; the cleanup is hygiene.

## The application

- [x] Every SQL query is parameterised. Values go in the array, never into the
      string. This is one line of defence you already know how to do
      ↳ Every value is a `$1`, `$2`… placeholder. The only built-up SQL is the column list in the two UPDATEs, taken from a fixed allowlist
- [x] Input is validated **on the server**, not only in React. Length limits on
      every text field
      ↳ `server/src/validation.ts` on every POST/PATCH: names 120, categories 40, buyer/seller 100, notes 1000, URLs 500 characters, plus types, dates, money 0–₱10M and allowed statuses
- [x] `cors({ origin: allowedOrigins })` names your origins. Not `cors()` with no
      options, which allows every site on the internet
      ↳ `cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' })` in `server/src/index.ts`
- [ ] `NODE_ENV=production` on the host, and no stack trace in any response body
      ↳ **Half.** No response ever contains a stack trace (every error is a fixed message; I checked with the database switched off). `server/Dockerfile` sets `NODE_ENV=production`, but the app isn't deployed on a host yet
- [x] `helmet` installed, which is one line for several real protections
      ↳ `app.use(helmet())` in `server/src/index.ts`; responses carry `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` and a CSP, and no `X-Powered-By`
- [x] Anything that costs money or accepts a password is rate limited
      ↳ `POST /api/auth/login` allows 10 failed tries per 15 minutes per address (`express-rate-limit`), then gives 429. Nothing in the app costs money
- [x] Passwords, if you have accounts, are hashed with bcrypt and never logged
      ↳ The one password is stored only as a bcrypt hash (`AUTH_PASSWORD_HASH`) and checked with `bcrypt.compare`. No `console.log`/`console.error` includes the password
- [x] Every route that touches somebody's data has the ownership check **in the
      query**, as `AND user_id = $2`, not as an `if` above it
      ↳ **N/A:** a single-user app. There's one account and no `user_id`, and every data route requires that account's token (`requireAuth`)
- [x] `npm audit` run once, and the easy fixes taken
      ↳ Ran `npm audit fix` in `server/` (Express 4.22.3, for a `qs` advisory): **0 vulnerabilities** in `server/` and `client/`. Re-run on Oct 9, 2026, before deploying: two new advisories had appeared (`proxy-addr`, critical, in the server; `source-map-js`, high, in the client build tools). `npm audit fix` updated both lockfiles, and both are back to **0**

```bash
npm install helmet
```

```js
import helmet from 'helmet'
app.use(helmet())
```

## Privacy

The half that matters more, because it is about other people.

- [x] **No real classmates' names, numbers, emails or photos**, anywhere. Not in
      seed data, not in screenshots, not in the demo video. Consent for a course
      project does not cover the next ten years of a public repository
      ↳ No classmates anywhere. The screenshots used to show my real **customers'** names; they've been retaken from the sample data, and the demo video will use only the sample data
- [x] Seed data is invented. Yours will be read
      ↳ `seed.sql` / `seed.json`: 22 groups, 147 items, 35 expenses, all invented (platforms as sellers, "Marco R."-style buyers, `example.com` links), checked against my real export for name matches
- [x] If real people tested your app, even three friends, their data is deleted
      before you submit
      ↳ Only I have used it. My local database now holds only the invented data
- [x] If your app collects anything about anyone, the app says what it collects
      ↳ The login screen has a short note (buyer names, seller names and sale details, kept only to track inventory and profit), and the README has a Privacy section with the full list
- [x] Any face in a screenshot is stock, generated, or yours
      ↳ **N/A:** no faces in any screenshot. The logo is generated

If your project handles personal information about real people, you are inside
the Philippine Data Privacy Act. Collect the minimum, say what you collect, and
do not collect anything you cannot justify.

## What to write in your journal

One short paragraph: the riskiest thing about your project from this list, what
you did about it, and what you knowingly accepted. A student who can name the
tradeoff they made scores better than one who claims there was none.

**My paragraph:** in [`journal/week-2.md`](../journal/week-2.md), under "What I learned", "My security trade-off".
