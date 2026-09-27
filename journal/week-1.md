# Reflection Journal

## Week of: September 16 – 23, 2026

## My goal this week

Get FlippyFloppy's documentation to the point where someone who has never seen it could understand
it, set it up and run it from the repo alone. That meant:
- the weekly report
- a README that follows the documentation guide
- `AI-USAGE.md`
- the security checklist
- matching my repo to the folder structure our professor gave us

The app itself already worked. This week was about proving it and explaining it.

## What I did

- **Refined my midterm reflection journal** (Sep 21), especially the backend and "what clicked" parts.
- **Wrote my first weekly report**, covering everything from Aug 27 to Sep 23: the schema, all 19 API endpoints, all 8 screens, and the Supabase data import.
- **Rewrote the README** section by section against the documentation guide:
  - setup from nothing (installing Postgres, creating the database user, every environment variable with a placeholder)
  - how to run it and what you should see
  - the main flow from buying to selling
  - the full API table
  - the folder map
  - an honest known-issues list

  I also took screenshots of six screens for it.
- **Started `AI-USAGE.md`.** Instead of writing it from memory, I had my old Claude Code session logs read, so every entry comes from what actually happened on Aug 27, Sep 1 and Sep 3: what I asked, what came back, and what I had to send back to be fixed.
- **Filled in the security checklist** by checking each row against the actual repo, the git history and my local Postgres settings, not by ticking boxes.
- **Compared my repo with the professor's template structure.** I added:
  - a sample-data seed (`npm run seed`) with made-up data
  - a demo mode that runs with no server, and a GitHub Pages workflow for it
  - Docker files
  - the `docs/` folder with my proposal, mockup and design system

## What blocked me

- **I have no code that I wrote myself yet.** Filling in `AI-USAGE.md` showed me that every file in `client/src` and `server/src` was last written by the AI, not by me. The finals badge needs at least a fifth of the project to be mine, so I can't finish section 3 of `AI-USAGE.md` until I write something real myself.
- **I only have one commit**, from Sep 16, and all my work before that is inside it. The AI-usage rubric counts the commit history as evidence, so starting to commit regularly is urgent.
- **The security checklist found problems I didn't know about:**
  - My personal Gmail is the author of that one commit, and GitHub shows it publicly.
  - My old Supabase project still lets anyone with the public anon key read my tables, including buyer names.
  - The PATCH routes don't check the values they receive.
- **The professor's templates got overwritten.** I copied them into `docs/` while the AI was adding files, and it wrote over three of them before I committed. Now I need to get them again and fit my content to their questions.
- **Docker isn't installed on my laptop**, so the Docker files are untested.

## What I learned

- **A `.gitignore` doesn't make a repo private.** It kept my `.env` out, but my email still went public through the commit author, which I never thought of as "in the repo".
- **Supabase's anon key is public on purpose**, so the only thing protecting the data is Row Level Security. My data was pulled from Supabase with nothing but that key, which shows RLS was never protecting it.
- **Express 4 doesn't catch errors from `async` routes.** If a GET route with no `try/catch` hits a database error, the request just hangs instead of returning a 500. I would never have noticed this by clicking through the app, because it only shows up when something goes wrong.
- **Postgres has two separate security settings.** `listen_addresses = '*'` sounds like the database is open to everyone, but `pg_hba.conf` decides who can actually connect, and mine only allows my own machine.
- **Documentation is its own kind of testing.** Writing "this endpoint returns X" made me go check that it really did, and one first-draft line turned out to be wrong.
- **About working with AI:** it saves a lot of time, but the rubric is right that catching its mistakes is the skill. This week it overwrote files without checking, and it bundled demo data into the real build until a check caught it. I need to commit before letting it touch files, and read what it changed.
