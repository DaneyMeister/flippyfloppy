# 1. App Proposal

> Written after the app was built, not before. FlippyFloppy is a migration of a
> Flutter + Supabase app I was already using, so this proposal describes the app that exists.

## App name

**FlippyFloppy**

- **Flippy**: the business itself: buy, flip, sell. It's a word with motion in it, for an app whose whole job is tracking things as they move through statuses instead of sitting still in a list.
- **Floppy**: a floppy disk, which works two ways. It is the most recognizable piece of obsolete PC hardware, which suits an app built around secondhand computer parts. And its one job was to hold onto data that mattered. That is what this app is for the flipping business: the record of every purchase, sale and profit that would otherwise live in someone's head or get lost in a notebook.

## What the app is for, in one sentence

A ledger for someone who flips PC parts: log what a component or build cost and what it sold for, and see the real profit as soon as the sale is logged, instead of working it out by hand across a dozen purchase batches.

## Who is it for

- **Who, specifically:** one person who buys used PC parts and pre-built systems, tests and re-lists them, and sometimes assembles several components into a build to sell as one unit. That's me, and I ran the business on a Flutter app before this rebuild.
- **What they're doing when they open it:** logging a purchase right after buying it, changing an item's status as it moves from testing to listed to sold, or checking whether a batch actually made a profit once everything in it has sold.

## Sections or routes this app needs

| # | Section / route | What it is for |
| - | --- | --- |
| 1 | `/` Dashboard | The home base: total expenses, revenue and profit at a glance, plus each purchase group's own running total |
| 2 | `/inventory` | Every component currently owned. You can search it, filter by status, change a status in place, or tap a row to edit |
| 3 | `/acquisition` | Log a new purchase: either a whole batch (a PC, a bundle) or one part added quickly |
| 4 | `/sell-build` | Sell several components together as one build, with one buyer and one sale date |
| 5 | `/sold-items` | History of every sale, grouped back into the build it was sold as, with a way to undo one |
| 6 | `/monthly-summary` | Expenses, revenue and profit for one calendar month |
| 7 | `/price-index` | What a specific part has cost to buy and sold for in the past, so pricing the next one isn't a guess |

Seven routes, not the worksheet's 3–5, and none of them can simply be removed. Without Price Index you
can still buy, track and sell, but you'd be guessing at prices with no record of what similar parts
actually went for, which is why the original app gained that screen. **Acquisition** and
**Sell Build** are the two that really can't go, because they are the only places data is written;
every other screen just shows it.

## State: what data does the app hold?

For the busiest screen, the Dashboard. The same data drives every other screen too.

| Data | Shape (rough) | Who owns it (which component) | Changes when... |
| --- | --- | --- | --- |
| `groups` | `[{ id, groupName, groupType, baseCost, purchaseDate, expenses[] }]` | `InventoryContext` | a batch purchase is logged, or a group's details are edited |
| `items` | `[{ id, groupId, name, category, status, assignedCost, soldPrice? }]` | `InventoryContext` | an item is added, edited, sold, returned or deleted |
| `selectedGroupId` | `string \| null` | `DashboardPage` | a group card is tapped (opens its detail sheet) or closed |
| `token` | `string \| null` | `AuthContext` | the user logs in or out |

## What each screen contains

**Dashboard**
1. KPI row: total expenses, revenue, net profit, liquid assets
2. Group Summary header: group count and a category filter
3. Group card grid: one card per purchase batch; tap to open the details
4. Group detail sheet: cost and revenue breakdown, expense list, item list, and a button to edit

**Inventory**
1. Search bar: filters by name, category or group
2. Status filter: one status, or all active items
3. Item list or table: name, category, group, status, cost and dates; tap a row to edit it
4. Edit Item sheet: the same editor the Dashboard's group detail opens

**Acquisition**
1. Mode toggle: Batch Purchase or Quick Add
2. Purchase Details card: group name, type, date, base cost, seller
3. Additional Expenses card: category and amount rows you can repeat
4. Components card: one row per item (Batch mode only)
5. Save button: sends the whole form as one request

**Sell Build**
1. Search bar: finds items with status SELLING to add to the build
2. Selected components list: one row per part, each with its own sold-price field
3. Sale Details card: buyer, sale date and listing link, shared by every item in the build
4. Total and submit bar: running total and "Mark Build as Sold"

**Sold Items**
1. Sale cards: items grouped by buyer and sale date, so a build reads as one sale
2. One line per item: name, category, sold price
3. Return Sale button: puts the whole group back into available inventory

**Monthly Summary**
1. Month picker: reloads everything below it for the chosen month
2. KPI row: that month's expenses, revenue, net profit and items sold
3. Sold-this-month list: name, category, buyer, sale date, price

**Price Index**
1. Keyword search: matches name, category and notes
2. Stat row: average cost, average sold price, highest sold price
3. Sale history: every past sale matching the keyword, most recent first

Once all seven are side by side, a pattern shows: every screen is *filters, a list and one action*
arranged differently. That's why `StatusSelect`, `SummaryCard` and the card/table list could each be
built once and reused.

## Content you need to gather

- ✓ **Real inventory history.** It already existed in the Flutter app's Supabase project and was imported in full (22 groups, 147 items, 35 expenses). That real data stays on my machine only. The repository ships invented sample data instead (`server/src/db/seed.sql`).
- ✓ **A logo.** I generated it, then turned it into a favicon and the sidebar and login image.
- ✓ **The fixed lists of categories and statuses** (CPU, GPU, MoBo… / Selling, Sold, Tester…), carried over unchanged from the original app.

## One risk

The shared "running-cost bucket" groups are Bought Components, Defective Items, Extra Peripherals
and Collection Set. Unlike a normal batch purchase, they don't have a fixed base cost. Their base cost
is *derived*: it is the sum of the items currently in them, recalculated whenever an item is added,
edited or removed.

Copying that faithfully from the Flutter version meant the server has to redo that sum after every
change that could touch one of these four groups: quick add, item update, item delete, and the group
editor's "add component". This was the one piece of business logic that needed real care so it
wouldn't quietly drift from the original app. It lives in `recalculateGroupBaseCost` in
`server/src/services/groupsService.ts`.
