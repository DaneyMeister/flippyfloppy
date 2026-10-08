# Weekly Increment Report

## Week of: September 28 – October 4, 2026

## What changed this week

**Dashboard redesign**
- **Net Profit / Loss is now the main card** (`client/src/components/StatCards.tsx`, `DashboardStats.tsx`). It shows the profit in large type, the return on cost, "Cost recovered" (revenue ÷ expenses) and how many groups are profitable. Total Expenses, Total Revenue and Total Liquid Assets sit beside it as smaller cards, each with a short label ("Base + fees", "Sold only", "43 for sale").
- **Net profit over time chart** (`client/src/components/ProfitChart.tsx`). A curved line of running net profit by month, starting below zero in March and crossing into profit as sales come in.
  - The data comes from a new profit timeline in `server/src/services/analyticsService.ts`, with `client/src/utils/profitTimeline.ts` and `chartPoints.ts` doing the same for the server-less build.
- **Less visual noise:** removed the dashboard icons, the green glow behind the profit card and the green box around the return-on-cost figure. Reduced bold text across the whole site.
- **Monthly Summary** redesigned to match the Dashboard, with a tighter phone layout and its chart at the bottom.

**Dialogs, forms and motion**
- **In-app confirmation window** (`ConfirmDialog.tsx`) instead of the browser's plain prompt, for deleting an item ("Keep the Item" / "Delete Item") and for returning a sale. The red button is subtler, and the window has an outline so it stands out in dark mode.
- **Styled dropdowns and a custom date picker** (`DatePicker.tsx`) that match the site in light and dark mode, instead of the browser's default controls.
- **Simple animations:** windows fade and scale in, and the active tab has a sliding indicator (`useSlidingIndicator.ts`). Sharp corners were rounded off.

**Screens**
- **Sold Items** is a compact ledger: one row per sale with buyer, date, item and price. On phones the Return button sits in the row's top-right corner.
- **Account menu:** the "A" avatar in the header now holds the light/dark toggle and Log out, instead of the sidebar.
- **Price Index searches as you type.** The search waits for a short pause, and a slow, out-of-date response can't overwrite a newer one.
- **Inventory on tablets** shows cards, two per row, like the phone view. The table only appears from 1280 px wide, where it fits.
- **Phone and tablet sizing:** the profit number shrinks for 6- and 7-digit amounts, the "Base + fees"-style labels stay on one line, and on tablets the profit card is narrower so the chart gets more room.
- The loading skeletons in `Skeletons.tsx` were changed to match each new layout.

## Why

- **The most important number wasn't the most visible one.** Net profit is what tells me whether flipping is worth it, but it was one card among five, the same size as the rest. Making it the main card, with the chart beside it, shows at a glance whether I'm making money and how that changed month to month.
- **The browser's own prompt and controls didn't belong in the app.** A grey "OK / Cancel" box for deleting an item, and the browser's date picker, looked unfinished next to the rest of the UI, and "OK" doesn't say what will happen. The new window names the action on its buttons.
- **It has to work at every screen size.** I checked each screen at phone and tablet widths, and most of the week-3 fixes came from screenshots of my own screen where something was cramped, cut off or wasted space.
- **Every number has to be explainable.** Before keeping "Cost recovered", I checked what it calculates, so the dashboard doesn't show anything I can't explain.

## What broke or what I got stuck on

- **The Inventory tablet layout didn't change on my screen.** The first version switched from cards to the table at 1024 px. My window was wider than that, so I still saw the cramped table. The table needs about 1,120 px (820 px minimum plus the 256 px sidebar), so the switch was moved to 1280 px. Logged as case 11 in `AI-USAGE.md`.
- **The profit number took several rounds to size.** Too big on tablets, too much empty space around it on phones, and 6- and 7-digit amounts wrapped. It now scales with the number of digits.
- **Lint warnings.** `npm run lint` reports 4 warnings (setting state inside effects in three files, and a non-component export in `ConfirmDialog.tsx`). No errors, and the build passes.
- **Still untested:** the Docker files and the GitHub Pages workflow.
- **No automated tests yet.** Every change was checked by hand in the browser at phone, tablet and desktop widths, plus typecheck/build/lint.

## What is left

- Deploy the full app (database, API, client) and set `trust proxy` for the login rate limit.
- Push the week 3 commits, turn on GitHub Pages and check the first workflow run.
- Retake the README screenshots after the redesign, including phone and tablet views.
- Record the demo video (`docs/05-demo-video.md`).
- Add automated tests for the money flows: batch purchase, quick add, sell build, return sale.
- Close the open security items: secret scanning, the grader's login in my private README, a privacy note, and the old Supabase tables.
