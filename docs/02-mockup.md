# 2. Wireframes & Component Breakdown

> Drawn from the built app (2026-09-01) rather than sketched first: the screen map, a box sketch of
> each screen, and the component tree, all matching what `client/` actually contains.
> Real screenshots are in [`screenshots/`](screenshots/).

## A. Screen map

**Dashboard is the home base.** Logging in lands you there, and every other screen is one sidebar
click away in both directions, because the sidebar stays on every logged-in screen.

```
                    ┌────────────┐
                    │ Inventory  │
                    └─────┬──────┘
       ┌─────────────┐    │    ┌─────────────┐
       │ Price Index ├──┐ │ ┌──┤ Acquisition │
       └─────────────┘  │ │ │  └─────────────┘
┌───────┐ sign in  ┌────┴─┴─┴─────┐   ┌────────────┐
│ Login ├─────────►│  Dashboard   ├───┤ Sell Build │
└───▲───┘          │  (home base) │   └────────────┘
    │   log out    └────┬───┬─────┘
    └───────────────────┘   │    ┌────────────┐
                 ┌──────────┴──┐ │ Sold Items │
                 │  Monthly    ├─┴────────────┘
                 │  Summary    │
                 └─────────────┘
```

Every line is the same action: clicking that screen in the sidebar. Because the sidebar never
disappears, any screen also reaches any other screen directly. No screen is more than one click from
another, so there are no dead ends.

**Overlays inside a screen.** Some taps open a stacked overlay instead of changing the route.
`Esc` or clicking the backdrop closes one layer at a time.

```
Dashboard ─tap card─► Group Detail ─pencil─► Edit Group ─tap item─► Edit Item
Inventory ─tap row──────────────────────────────────────────────────► Edit Item
```

At most three layers deep. Inventory reaches the same Edit Item editor in one tap, so there is
exactly one editor for items.

## B. Box sketch per screen

Every logged-in screen shares the same frame: a sidebar on desktop that becomes a drawer behind a ☰
button on phones, plus a top bar with the page title, the theme toggle and an avatar. Only the main
column is different on each screen.

| Screen | Desktop (≥1024px) | Phone (375px) |
| --- | --- | --- |
| **Login** `/login` | Centered card: logo, "FlippyFloppy", username, password, [Sign in]. No sidebar | Same card, full width |
| **Dashboard** `/` | 4 KPI tiles in a row → "Group Summary · {n} groups · category ▾" → group cards, 3 across | KPIs as 2×2 → summary header → group cards, 1 across |
| **Inventory** `/inventory` | search · status ▾ · count → table: Name, Category, Group, Status ▾, Cost, Purchased, Sold, 🗑 | search → status ▾ → one card per item (status ▾, cost, dates, 🗑) |
| **Acquisition** `/acquisition` | [Batch Purchase \| Quick Add] → Purchase Details → Additional Expenses [+] → Components [+] → [Save] | Same stack at full width; paired fields become one column |
| **Sell Build** `/sell-build` | search (suggestions) → Selected Components (price each) → Sale Details → Total · [Mark Build as Sold] | Same stack; price field goes full width |
| **Sold Items** `/sold-items` | "Sales Record History" → one card per sale: buyer · date · items · total · [Return Sale] | Same cards, full width |
| **Monthly Summary** `/monthly-summary` | month picker → 4 KPI tiles → table: Name, Category, Buyer, Sale Date, Price | picker → KPIs 2×2 → one card per sold item |
| **Price Index** `/price-index` | search + [Search] → Avg Acquired · Avg Sold · Highest → history table | search → stats → one card per sale (fixed Sep 2026; it used to scroll sideways, see D) |

## C. Component tree

Built from the Dashboard, the busiest screen. Each level only uses pieces from the levels above it.

| Level | Components |
| --- | --- |
| **Atoms** | `StatusSelect` (repeats), `StatusBadge`, class-name constants `inputClass`, `buttonClass`, `secondaryButtonClass`, `dangerTextButtonClass` |
| **Molecules** | `SummaryCard` (repeats), `FormField`, search field (icon + input), expense row (repeats), component row (repeats) |
| **Organisms** | `Layout` (sidebar + drawer + top bar), `GroupDetailModal`, `EditGroupModal`, `EditItemModal`, group summary card (repeats), inventory table / card list |
| **Pages** | `LoginPage`, `DashboardPage`, `InventoryPage`, `AcquisitionPage`, `SellBuildPage`, `SoldItemsPage`, `MonthlySummaryPage`, `PriceIndexPage` |

**Who owns the state:**
- `InventoryContext` owns the live groups and items and the calls that change them. Every page reads from it.
- `AuthContext` owns the login token.
- `ThemeContext` owns light/dark mode.
- Components at the molecule level and below only hold their own form drafts.

## D. Sanity check: buy a part, then sell it

1. **Sign in** (`/login`). You land on the Dashboard.
2. **Acquisition** (`/acquisition`). Batch Purchase: fill in the details and one component, then save. `InventoryContext` reloads, so the new group shows everywhere without refreshing the page.
3. **Sell Build** (`/sell-build`). The search finds the part, because new items start as SELLING. Add a buyer and a price, then Mark Build as Sold.
4. **Sold Items** (`/sold-items`). The sale shows as one card. Return Sale is right there if it needs undoing.
5. **Dashboard** (`/`). Revenue and the group's card show the sale straight away, because they read the same shared data.

**What this turned up:**
- **No dead ends.** Every screen keeps the sidebar, and every overlay can be closed with its close button or `Esc`.
- **Each piece of state has one owner.** Dashboard, Inventory, Sell Build and Sold Items all read `InventoryContext`, so step 5 needed no extra code.
- **A real gap, fixed in week 2:** Price Index's sale history had no stacked-card layout for phones, while Inventory and Monthly Summary both had one. Since Sep 27, 2026 it shows one card per sale on phones.
