import seed from './seed.json';
import { SHARED_RUNNING_COST_GROUP_NAMES } from '../types';
import type { GroupExpenseRow, InventoryItemRow, ItemGroupRow } from '../types';

/**
 * In-browser stand-in for the Express API, used only when the client is built
 * with VITE_DEMO_MODE=true (the GitHub Pages demo). It answers the same paths
 * with the same row shapes as the real server, over the invented data in
 * seed.json, and keeps changes in this browser's localStorage only.
 */

type Db = { groups: ItemGroupRow[]; items: InventoryItemRow[]; expenses: GroupExpenseRow[] };

const STORAGE_KEY = 'flippyfloppy_demo_db';

function freshDb(): Db {
  return structuredClone(seed) as Db;
}

function load(): Db {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as Db;
  } catch {
    // storage unavailable or corrupt; fall back to the seed
  }
  return freshDb();
}

let db = load();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // demo still works for this page load without persistence
  }
}

class MockError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const now = () => new Date().toISOString();
const money = (v: unknown) => (v == null || v === '' ? null : Number(v).toFixed(2));
const num = (v: unknown) => Number(v ?? 0);

function groupWithExpenses(g: ItemGroupRow): ItemGroupRow {
  return { ...g, group_expenses: db.expenses.filter((e) => e.group_id === g.id) };
}

function groupById(id: string | null) {
  return id ? db.groups.find((g) => g.id === id) ?? null : null;
}

function isShared(groupId: string | null) {
  const g = groupById(groupId);
  return !!g && SHARED_RUNNING_COST_GROUP_NAMES.includes(g.group_name);
}

function recalc(groupId: string | null) {
  const g = groupById(groupId);
  if (!g) return;
  const total = db.items.filter((i) => i.group_id === g.id).reduce((s, i) => s + num(i.assigned_cost), 0);
  g.base_cost = money(total)!;
}

function newGroup(data: { name: string; type: string; date: string; baseCost: number; boughtFrom: string | null }) {
  const g: ItemGroupRow = {
    id: crypto.randomUUID(),
    group_name: data.name,
    group_type: data.type as ItemGroupRow['group_type'],
    purchase_date: data.date,
    base_cost: money(data.baseCost)!,
    bought_from: data.boughtFrom,
    created_at: now(),
  };
  db.groups.push(g);
  return g;
}

function newItem(fields: Partial<InventoryItemRow> & { group_id: string; name: string; category: string; status: string }) {
  const item: InventoryItemRow = {
    id: crypto.randomUUID(),
    group_id: fields.group_id,
    name: fields.name,
    category: fields.category,
    status: fields.status as InventoryItemRow['status'],
    assigned_cost: fields.assigned_cost ?? '0.00',
    listed_price: fields.listed_price ?? null,
    sold_price: null,
    notes: fields.notes ?? null,
    buyer_name: null,
    sale_date: null,
    listing_url: fields.listing_url ?? null,
    purchase_date: fields.purchase_date ?? null,
    bought_from: fields.bought_from ?? null,
    created_at: now(),
  };
  db.items.push(item);
  return item;
}

function addExpenses(groupId: string, list: { category: string; amount: number; itemId?: string | null }[]) {
  return list.map((e) => {
    const row: GroupExpenseRow = {
      id: crypto.randomUUID(),
      group_id: groupId,
      item_id: e.itemId ?? null,
      category: e.category,
      amount: money(e.amount)!,
      created_at: now(),
    };
    db.expenses.push(row);
    return row;
  });
}

function dashboard() {
  const groupSummaries = [...db.groups]
    .sort((a, b) => b.purchase_date.localeCompare(a.purchase_date))
    .map((g) => {
      const items = db.items.filter((i) => i.group_id === g.id);
      const extra = db.expenses.filter((e) => e.group_id === g.id).reduce((s, e) => s + num(e.amount), 0);
      const totalCost = num(g.base_cost) + extra;
      const revenue = items.reduce((s, i) => s + num(i.sold_price), 0);
      return {
        group: {
          id: g.id,
          groupName: g.group_name,
          groupType: g.group_type,
          purchaseDate: g.purchase_date,
          baseCost: num(g.base_cost),
          boughtFrom: g.bought_from,
        },
        totalCost,
        totalAssignedCost: items.reduce((s, i) => s + num(i.assigned_cost), 0),
        revenue,
        netProfit: revenue - totalCost,
        itemCount: items.length,
      };
    });
  const totalExpenses = groupSummaries.reduce((s, g) => s + g.totalCost, 0);
  const sold = db.items.filter((i) => i.status === 'SOLD');
  const selling = db.items.filter((i) => i.status === 'SELLING');
  const totalRevenue = sold.reduce((s, i) => s + num(i.sold_price), 0);
  return {
    totalExpenses,
    totalRevenue,
    netProfit: totalRevenue - totalExpenses,
    totalLiquidAssets: selling.reduce((s, i) => s + num(i.assigned_cost), 0),
    sellingItemCount: selling.length,
    groupSummaries,
  };
}

function monthly(year: number, month: number) {
  if (!year || !month || month < 1 || month > 12) {
    throw new MockError(400, 'year and month (1-12) query params are required');
  }
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  const startDay = start.toISOString().slice(0, 10);
  const endDay = end.toISOString().slice(0, 10);

  const monthGroups = db.groups.filter((g) => g.purchase_date >= startDay && g.purchase_date <= endDay);
  const totalExpenses =
    monthGroups.reduce((s, g) => s + num(g.base_cost), 0) +
    db.expenses.filter((e) => monthGroups.some((g) => g.id === e.group_id)).reduce((s, e) => s + num(e.amount), 0);

  const soldItems = db.items
    .filter((i) => i.status === 'SOLD' && i.sale_date && new Date(i.sale_date) >= start && new Date(i.sale_date) <= end)
    .sort((a, b) => (b.sale_date ?? '').localeCompare(a.sale_date ?? ''));
  const totalRevenue = soldItems.reduce((s, i) => s + num(i.sold_price), 0);

  const counts: Record<string, number> = {};
  for (const i of soldItems) counts[i.category] = (counts[i.category] ?? 0) + 1;
  let topCategory = 'None';
  let max = 0;
  for (const [cat, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      topCategory = cat;
    }
  }

  return { totalExpenses, totalRevenue, netProfit: totalRevenue - totalExpenses, itemsSold: soldItems.length, topCategory, soldItems };
}

function priceLookup(keyword: string) {
  const q = keyword.trim().toLowerCase();
  if (!q) return { keyword: '', matches: [], averageAcquiredCost: 0, averageSoldPrice: 0, highestSoldPrice: 0, history: [] };
  const matches = db.items.filter((i) =>
    [i.name, i.category, i.notes ?? ''].some((field) => field.toLowerCase().includes(q))
  );
  const sold = matches.filter((i) => i.status === 'SOLD' && i.sold_price != null);
  const avg = (list: InventoryItemRow[], pick: (i: InventoryItemRow) => number) =>
    list.length ? list.reduce((s, i) => s + pick(i), 0) / list.length : 0;
  return {
    keyword,
    matches,
    averageAcquiredCost: avg(matches, (i) => num(i.assigned_cost)),
    averageSoldPrice: avg(sold, (i) => num(i.sold_price)),
    highestSoldPrice: sold.length ? Math.max(...sold.map((i) => num(i.sold_price))) : 0,
    history: sold
      .map((i) => ({ name: i.name, buyerName: i.buyer_name, soldPrice: num(i.sold_price), saleDate: i.sale_date, status: i.status }))
      .sort((a, b) => (b.saleDate ?? '').localeCompare(a.saleDate ?? '')),
  };
}

// Same single-account rule as the real server. The account comes from build-time
// env vars (repo secrets in the Pages workflow), and only a SHA-256 of the
// password is baked into the bundle, never the password itself.
const DEMO_USERNAME = import.meta.env.VITE_DEMO_USERNAME;
const DEMO_PASSWORD_SHA256 = import.meta.env.VITE_DEMO_PASSWORD_SHA256;

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function login(body: any) {
  if (typeof body.username !== 'string' || typeof body.password !== 'string') {
    throw new MockError(400, 'username and password are required');
  }
  if (!DEMO_USERNAME || !DEMO_PASSWORD_SHA256) {
    throw new MockError(500, 'Login is not configured (VITE_DEMO_USERNAME / VITE_DEMO_PASSWORD_SHA256)');
  }
  if (body.username !== DEMO_USERNAME || (await sha256Hex(body.password)) !== DEMO_PASSWORD_SHA256.toLowerCase()) {
    throw new MockError(401, 'Invalid credentials');
  }
  return { token: 'demo-token' };
}

const ITEM_FIELDS = [
  'group_id', 'name', 'category', 'status', 'assigned_cost', 'listed_price',
  'sold_price', 'notes', 'buyer_name', 'sale_date', 'listing_url', 'purchase_date', 'bought_from',
] as const;
const MONEY_FIELDS = new Set(['assigned_cost', 'listed_price', 'sold_price']);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function route(method: string, path: string, query: URLSearchParams, body: any): unknown {
  const parts = path.split('/').filter(Boolean); // ['api', 'items', ':id']
  const [, resource, id] = parts;

  if (method === 'POST' && path === '/api/auth/login') return login(body);

  if (resource === 'groups') {
    if (method === 'GET' && !id) {
      return [...db.groups].sort((a, b) => b.purchase_date.localeCompare(a.purchase_date)).map(groupWithExpenses);
    }
    const g = groupById(id);
    if (!g) throw new MockError(404, 'Group not found');
    if (method === 'GET') return groupWithExpenses(g);
    if (method === 'PATCH') {
      if (body.groupName !== undefined) g.group_name = body.groupName;
      if (body.groupType !== undefined) g.group_type = body.groupType;
      if (body.purchaseDate !== undefined) g.purchase_date = body.purchaseDate;
      if (body.baseCost !== undefined) g.base_cost = money(body.baseCost)!;
      if (body.boughtFrom !== undefined) g.bought_from = body.boughtFrom;
      return groupWithExpenses(g);
    }
  }

  if (resource === 'items') {
    if (method === 'GET' && !id) {
      return [...db.items]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((i) => ({ ...i, item_group: groupById(i.group_id) }));
    }

    if (method === 'POST' && !id) {
      if (!body.groupId || !body.name || !body.category || !body.status) {
        throw new MockError(400, 'groupId, name, category, and status are required');
      }
      const cost = money(body.assignedCost ?? 0)!;
      const item = newItem({
        group_id: body.groupId, name: body.name, category: body.category, status: body.status,
        assigned_cost: cost, listed_price: cost, notes: body.notes ?? null,
      });
      if (isShared(body.groupId)) recalc(body.groupId);
      return item;
    }

    if (method === 'POST' && id === 'batch') {
      if (!body.groupName || !body.groupType || !body.purchaseDate || !body.components?.length) {
        throw new MockError(400, 'groupName, groupType, purchaseDate, and at least one component are required');
      }
      const g = newGroup({ name: body.groupName, type: body.groupType, date: body.purchaseDate, baseCost: num(body.baseCost), boughtFrom: body.boughtFrom ?? '' });
      const expenses = addExpenses(g.id, body.additionalExpenses ?? []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = body.components.map((c: any) =>
        newItem({
          group_id: g.id, name: c.name, category: c.category, status: c.status,
          assigned_cost: money(c.assignedCost)!, listed_price: money(c.listedPrice ?? c.assignedCost),
          notes: c.notes ?? null, listing_url: c.listingUrl ?? null,
        })
      );
      return { group: g, expenses, items };
    }

    if (method === 'POST' && id === 'quick-add') {
      if (!body.name || !body.category || !body.status || !body.purchaseDate || !body.targetGroupName) {
        throw new MockError(400, 'name, category, status, purchaseDate, and targetGroupName are required');
      }
      const g =
        db.groups.find((x) => x.group_name === body.targetGroupName) ??
        newGroup({ name: body.targetGroupName, type: 'Individual', date: now().slice(0, 10), baseCost: 0, boughtFrom: null });
      const item = newItem({
        group_id: g.id, name: body.name, category: body.category, status: body.status,
        assigned_cost: money(body.baseCost ?? 0)!, notes: body.notes ?? null, listing_url: body.listingUrl ?? null,
        purchase_date: body.purchaseDate, bought_from: body.boughtFrom ?? '',
      });
      const expenses = addExpenses(
        g.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (body.additionalExpenses ?? []).filter((e: any) => e.amount >= 0).map((e: any) => ({ ...e, itemId: item.id }))
      );
      recalc(g.id);
      return { group: g, item, expenses };
    }

    if (method === 'POST' && id === 'sell-build') {
      if (!body.itemSoldPrices || !Object.keys(body.itemSoldPrices).length || !body.buyerName || !body.saleDate) {
        throw new MockError(400, 'itemSoldPrices, buyerName, and saleDate are required');
      }
      for (const [itemId, price] of Object.entries(body.itemSoldPrices)) {
        const item = db.items.find((i) => i.id === itemId);
        if (!item) continue;
        item.status = 'SOLD';
        item.sold_price = money(price);
        item.buyer_name = body.buyerName;
        item.sale_date = body.saleDate;
        if (body.listingUrl) item.listing_url = body.listingUrl;
      }
      return undefined;
    }

    if (method === 'POST' && id === 'return-sale') {
      if (!Array.isArray(body.itemIds) || !body.itemIds.length) throw new MockError(400, 'itemIds must be a non-empty array');
      for (const item of db.items.filter((i) => body.itemIds.includes(i.id))) {
        Object.assign(item, { status: 'SELLING', sold_price: null, buyer_name: null, sale_date: null, listing_url: null });
      }
      return undefined;
    }

    const item = db.items.find((i) => i.id === id);
    if (!item) throw new MockError(404, 'Item not found');
    if (method === 'GET') return item;

    if (method === 'PATCH') {
      const oldGroup = item.group_id;
      for (const key of ITEM_FIELDS) {
        if (key in body) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item as any)[key] = MONEY_FIELDS.has(key) ? money(body[key]) : body[key];
        }
      }
      if (isShared(oldGroup)) recalc(oldGroup);
      if (item.group_id !== oldGroup && isShared(item.group_id)) recalc(item.group_id);
      return item;
    }

    if (method === 'DELETE') {
      db.items = db.items.filter((i) => i.id !== id);
      for (const e of db.expenses) if (e.item_id === id) e.item_id = null;
      if (isShared(item.group_id)) recalc(item.group_id);
      return undefined;
    }
  }

  if (resource === 'expenses') {
    if (method === 'POST' && !id) {
      if (!body.groupId || !Array.isArray(body.expenses) || !body.expenses.length) {
        throw new MockError(400, 'groupId and a non-empty expenses array are required');
      }
      const inserted = addExpenses(body.groupId, body.expenses);
      if (isShared(body.groupId)) recalc(body.groupId);
      return inserted;
    }
    if (method === 'DELETE' && id) {
      db.expenses = db.expenses.filter((e) => e.id !== id);
      return undefined;
    }
  }

  if (resource === 'analytics' && method === 'GET') {
    if (id === 'dashboard') return dashboard();
    if (id === 'monthly') return monthly(Number(query.get('year')), Number(query.get('month')));
    if (id === 'price-lookup') return priceLookup(query.get('q') ?? '');
  }

  throw new MockError(404, `Demo API has no route for ${method} ${path}`);
}

/** Same contract as the HTTP request(): resolves with the body, or throws { status, message }. */
export async function mockRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const url = new URL(path, 'http://demo.local');
  const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
  const result = await route(method, url.pathname, url.searchParams, body);
  if (method !== 'GET') save();
  // Hand back a copy so pages can't mutate the demo "database" by accident.
  return (result === undefined ? undefined : structuredClone(result)) as T;
}

export { MockError };
