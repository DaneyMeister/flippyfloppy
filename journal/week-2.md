# Reflection Journal

## Week of: September 24 – 27, 2026

## My goal this week

Week 1 was about documenting FlippyFloppy. This week was about changing the app itself, with four updates I chose:
- a dummy dataset, so no personal or real information could leak
- auto-numbered group names when adding a new group
- more detailed loading screens (skeletons)
- making sure "Total Liquid Assets" only counts items marked SELLING

On top of that, I wanted to close the security gaps my week 1 checklist had marked "No" before the repo goes public, and keep a checklist so every change could be tested one by one.

## What I did

- **Replaced my real data with invented data the same size:** 22 groups, 147 items, 35 expenses. Sellers are platforms, buyers are a first name and an initial, and links go to `example.com`. I wiped my local database and loaded it in one transaction, then checked that none of my real rows or customer names were left. My real data is still in Supabase.
- **Made the dummy data realistic.** The first version showed a ₱54,620 loss, which looked like I was losing money. I had it repriced the way flipping really works (you buy a set cheap and part it out), so it now shows +₱41,630, close to how my real numbers looked.
- **Checked liquid assets** and found it already counts only SELLING items, at what I paid for them. No change needed.
- **Auto-numbered group names:** picking "PC Set" on Acquisition now suggests "PC Set 7", because PC Set 1–6 exist.
- **Skeleton loading screens** on seven screens, each shaped like the real page.
- **Security fixes:**
  - error handling on every route
  - server-side validation with length limits
  - `helmet`
  - a rate limit on login
  - `npm audit` down to 0 vulnerabilities
- **A phone layout for Price Index**, so the table doesn't scroll sideways any more.
- **Kept a `week-2-checklist.md`** with the test steps for every task, and ticked things off only after testing them myself.

## What blocked me

- **A bug I didn't know I had.** Saving an edit to a group moved its purchase date one day earlier, every time, even when I didn't touch the date. It had been in the app since August. It only showed up because a test re-saved some records with their own values and three dates changed. I had to find where the day was being lost (the database driver and my timezone) and then put those three records back.
- **I thought my login was broken.** My login screen suddenly said "type any username and password". It turned out my PowerShell window still had demo mode switched on from testing earlier, so I was running the GitHub Pages version of the app. My real login had never changed.
- **The screenshots.** My six README screenshots showed real customers' full names, so I had to retake all of them from the new data before I could commit.
- **The commit email.** Before committing, I had to rewrite my first commit so it shows my GitHub no-reply address instead of my personal Gmail. That changed its hash, so every link to it in `AI-USAGE.md` had to be updated. Supabase RLS and code of my own for `AI-USAGE.md` are still open.
- **Things I can't test on my laptop:** the Docker files, and the GitHub Pages workflow, which has never run.

## What I learned

- **Dates are harder than they look.** A plain date like `2026-09-12` and a moment in time are different things. My database stored a plain date, but the driver turned it into "midnight in UTC+8", and once that became UTC it was the day before. I now know why `toISOString().slice(0, 10)` is dangerous in the Philippines: before 8 AM it gives you yesterday.
- **Showing features without real data.** Real customer names can't go into a public repo, but an empty or tiny dataset can't show what the app does. A dataset that is invented but realistic (same size, every status, sales in every month, even the profit margin) solves both.
- **Validation belongs on the server.** My forms already stopped empty names, but anyone can send a request without the form. A test request set an item's status to "SOLDISH", a cost of −5 and a `javascript:` link; before this week the server would have tried to save all three.
- **A loading screen can hide a bug or show one.** Before the skeletons, Sold Items said "No sales recorded yet" for a moment every time it loaded. That wasn't just ugly, it was a wrong message.
- **My security trade-off:** the riskiest thing about my project was real customer data ending up in a public repository, through the database, screenshots or the demo. I replaced the data and I'm keeping the screenshots out until they're retaken. What I knowingly accept is that the GitHub Pages version has no server, so its password hash is inside the site's code. It stops casual visitors, but it isn't real security, so that password isn't used anywhere else, and the data behind it is fake anyway.
- **Testing on a copy.** Testing the security changes on a separate copy of the server, with a throwaway login, meant I could try wrong passwords and broken requests without locking myself out or touching my data. The one time a test did touch my data (the date bug), it was the test that found the bug.
