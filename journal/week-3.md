# Reflection Journal

## Week of: September 28 – October 4, 2026

## My goal this week

Week 2 made the app safe to publish. This week was about making it look and feel finished. My week 2 report said "improve the UI based on tips and tricks from online", and that became:
- making Net Profit / Loss the main thing on the Dashboard, with a chart of profit over time
- replacing the browser's plain prompts and controls with ones that match the site
- fixing every screen that looked cramped or empty on a phone or tablet

## What I did

- **Redesigned the Dashboard** around a large Net Profit / Loss card, with return on cost, cost recovered and profitable groups underneath, and a curved line chart of running profit beside it. I used a reference image for inspiration without copying it.
- **Removed things that made it look busy:** the dashboard icons, a green glow behind the profit card, a green box around the return figure, and a lot of bold text across the site.
- **Redesigned Monthly Summary** to match the Dashboard.
- **Replaced the browser's delete prompt** with an in-app window that says "Keep the Item" / "Delete Item", and used the same window for returning a sale.
- **Restyled every dropdown and the date picker**, rounded the sharp corners, and added simple opening and sliding animations.
- **Phone and tablet fixes:** a compact Sold Items list with Return in the corner, a profit number that shrinks for big amounts, two-column Inventory cards on tablets.
- **Moved Log out and the theme toggle** into the "A" account menu.
- **Made Price Index search as I type.**
- **Checked every change in the browser** at phone, tablet and desktop widths, and sent a new screenshot whenever something still looked wrong.

## What blocked me

- **A fix that didn't fix anything.** I asked for Inventory to show cards on tablets, and was told it was done, but my screen looked exactly the same. The switch was set at 1024 px and my window was wider. The table actually needs about 1,120 px with the sidebar, so it had to move to 1280 px. I only caught it because I checked it myself.
- **Getting the profit number right.** It took several rounds: too big on tablets, too much empty space on phones, and long amounts wrapping onto two lines.
- **Knowing when to stop.** Each round of polish showed something else to fix, and the week was mostly UI, while deploying, tests and my own code for `AI-USAGE.md` are still waiting.

## What I learned

- **Know what every number means.** Before keeping "Cost recovered" on the Dashboard, I asked what it calculates (revenue ÷ expenses). If I can't explain a number on my own dashboard, it shouldn't be there.
- **Less is clearer.** Removing the glow, the icons and the extra bold made the important number stand out more than adding anything did.
- **"Done" isn't done until I see it.** The tablet layout was reported as finished but didn't change anything on my screen. Checking every change at the real screen sizes is what caught it.
- **Buttons should say what they do.** "OK" on a delete prompt doesn't tell you what happens. "Delete Item" and "Keep the Item" do. I also chose a single click with a confirmation window over press-and-hold, because it's faster and still hard to do by accident.
- **Live search needs care.** Searching on every keystroke means an older, slower response could arrive after a newer one and show the wrong results. The search waits for a short pause and ignores out-of-date answers.
