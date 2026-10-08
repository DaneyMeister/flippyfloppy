# Weekly reports

Five minutes a week. Add a new section at the top; never edit an old one.

The full report for each week is linked under its heading. This page is the short version.

---

## Week of 2026-09-28

Full report: [REPORT_10-4-26.md](../REPORT_10-4-26.md) · Journal: [week-3.md](../journal/week-3.md)

**Done.** Redesigned the Dashboard around a large Net Profit / Loss card with a chart of profit over time, and made Monthly Summary match it. Replaced the browser's delete prompt with an in-app confirmation window, restyled the dropdowns and date picker, and moved Log out and the theme toggle into an account menu. Price Index now searches as you type. Fixed the phone and tablet layouts on Sold Items, Inventory and the stat cards. All of this works locally. Nothing is deployed yet.

**Stuck.** The Inventory tablet layout didn't change on my screen. The switch from cards to the table was at 1024 px, but the table needs about 1,120 px (820 px minimum plus the 256 px sidebar), so it was still cramped. Moved the switch to 1280 px. The profit number also took several rounds to size for phones, tablets and 6- or 7-digit amounts.

**Hours.** 6 hours

**Next.** Deploy the full app, and start writing tests of my own.

---

## Week of 2026-09-24

Full report: [REPORT_9-27-26.md](../REPORT_9-27-26.md) · Journal: [week-2.md](../journal/week-2.md)

**Done.** Replaced my real data with an invented dataset the same size (22 groups, 147 items, 35 expenses, +₱41,630 net profit). Added auto-numbered group names, skeleton loading screens and a phone layout for Price Index. Added server-side validation with length limits, error handling on every route, `helmet`, a login rate limit, and got `npm audit` to 0 vulnerabilities. Works locally. Nothing is deployed yet.

**Stuck.** Saving any edit moved a purchase date one day earlier. The `pg` driver turned DATE columns into local midnight in UTC+8, which became the previous day in UTC, and the edit forms filled their date boxes from that. Fixed by returning DATE columns as plain `YYYY-MM-DD` text in `server/src/db/pool.ts`. Also lost time when my login screen said "type any username": my terminal still had demo mode switched on from testing.

**Hours.** 7 hours

**Next.** Deploy, and turn on GitHub Pages for the server-less build.

---

## Weeks of 2026-08-27 to 2026-09-23

Full report: [REPORT_9-23-26.md](../REPORT_9-23-26.md) · Journal: [week-1.md](../journal/week-1.md)

**Done.** Rebuilt my Flutter + Supabase app as React + Express + PostgreSQL: the schema and migration runner, a REST API with JWT login, all eight screens, and a one-time import of my real data from Supabase (22 groups, 147 items, 35 expenses). Wrote the README, `AI-USAGE.md` and the security checklist. Works locally. Nothing is deployed yet.

**Stuck.** The async GET routes have no `try/catch`, and Express 4 doesn't pass rejected promises to the error handler, so if the database is down those requests hang instead of returning 500. Keeping each group's `base_cost` right when items, expenses or sales change took more work than the basic create, read, update and delete.

**Hours.** 9 hours

**Next.** Add error handling to the async routes, and replace my real data before the repo goes public.
