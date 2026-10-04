# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: the owner.** One person in the Philippines who buys used PCs, pre-built systems and loose parts, tests them, and resells them either individually or assembled into builds. It is a single-user app with one login. The owner uses it every day to run a real flipping business.
- **Secondary: evaluators.** The app is also a course final project with a public server-less demo on GitHub Pages. Graders and demo viewers judge it, but they never steer the workflow. When the owner's needs and a demo's polish conflict, the owner wins.

## Product Purpose

A ledger for a PC-flipping business. It records what every purchase cost, follows each part through its statuses, records sales (including several parts sold together as one build), and shows real profit per purchase group and per month as soon as a sale is logged. That replaces working it out by hand across dozens of batches.

Success means every purchase, sale and peso of profit is recorded and correct, and recording something is fast enough that it happens right away instead of later.

## Positioning

FlippyFloppy is built around how a flipper actually works: purchase **groups** (PC sets, system units, bundles) that split into components with an assigned cost each, shared running-cost bucket groups whose base cost is derived from their items, multi-part build sales with one buyer and one date, and a Price Index of the owner's own past sales for pricing the next listing. A generic inventory or spreadsheet tool has none of these.

The name carries the story. **Flippy** is buy, flip, sell. **Floppy** is the floppy disk: obsolete PC hardware whose one job was holding onto data that mattered. The app is the record that would otherwise get lost.

## Operating Context

- **Mixed devices.** The owner uses a phone on the spot to log a purchase or a sale at a meetup or marketplace. They use a desktop for review, bulk status changes and edits. Both have to be fully usable.
- **Core loop:** buy → list → sell → review. Acquisition (Batch Purchase or Quick Add) → Inventory (status changes) → Sell Build → Sold Items (returns) → Dashboard and Monthly Summary. Price Index supports pricing.
- **Local market.** Sellers and buyers are on Shopee, FB Marketplace and similar platforms. Expense categories include Gas, Delivery Fee, Tip and GCash Protection.
- **Runtime modes.** A full stack (React 19 + Vite + Tailwind v4 client, Express + raw-SQL Postgres API, JWT auth), or a server-less demo mode that keeps its data in the browser.

## Capabilities and Constraints

- **Routes:** Login, Dashboard, Inventory, Acquisition, Sell Build, Sold Items, Monthly Summary, Price Index.
- **Statuses (fixed, from the original Flutter app):** SELLING, SOLD, TESTER, COLLECTION, USING, DEFECTIVE.
- **Inventory categories (fixed):** CPU, CPU+Cooler, Cooler, MoBo, GPU, RAM, SSD, HDD, PSU, Case, Fans, Case+PSU, Case+Fans, Case Bundle, Monitor, Laptop, Bundle Set, Mouse, Keyboard, System Unit, PC Set.
- **Group types:** PC Set, System Unit, Bundle Set, plus the bucket groups Bought Components, Defective Items, Extra Peripherals and Collection Set. A bucket group's base cost is recalculated from its items.
- **Currency** is Philippine peso (₱) throughout.
- **Themes:** light and dark are both supported, toggled from the account menu in the header.
- **States:** every screen shows a skeleton of its own layout while loading. On phones, tables turn into stacked cards.
- **Validation limits:** names 120, categories 40, buyer/seller 100, notes 1000 and URLs 500 characters; money from 0 to ₱10,000,000.

## Brand Commitments

- The name **FlippyFloppy** and its meaning (see Positioning).
- The logo, `logo.png` at the repo root, used as the favicon and the sidebar and login image.
- The status and category vocabulary above, kept exactly as written.
- The ₱ peso and the Philippine marketplace context.
- Light and dark themes, both kept.

## Evidence on Hand

- **Real data:** the owner's actual records (22 groups, 147 items, 35 expenses), imported from the old Supabase app. They exist only on the owner's machine and must never be shown or committed. `migration_data/` is not in the repo.
- **Sample data:** `server/src/db/seed.sql`, which is made up and the same size as the real data. Sellers are platforms, buyers are a first name and an initial, and links go to example.com. It totals ₱255,170 in expenses, ₱296,800 in revenue and +₱41,630 net profit.
- **Docs:** `docs/` (proposal, mockup, design system, weekly reports, security), `README.md`, `AI-USAGE.md`, `SECURITY-CHECKLIST.md`, and screenshots in `docs/screenshots/`.
- **Not on hand:** testimonials, other users, usage metrics. Do not invent them.

## Product Principles

1. **The record must be right.** Totals, derived bucket costs and profit must stay correct. Clarity about money beats decoration.
2. **Record it now.** Logging a purchase or sale on a phone, on the spot, has to be quick and forgiving, or it won't happen.
3. **Built for flipping.** Groups, builds, buckets and past sale prices are the core ideas, not add-ons.
4. **Owner first, demo-worthy second.** It should impress evaluators, but never at the cost of daily usability.
5. **Private by default.** Real buyer and seller data never leaves the owner's machine. Public surfaces only ever use the sample data.

## Accessibility & Inclusion

- Text contrast must reach WCAG AA (4.5:1 for body text) in both light and dark themes. A failure in the profit-green text was found and fixed on 2026-09-03 (see `docs/03-design-system.md`).
- Layouts must work at phone width with touch-sized controls.
