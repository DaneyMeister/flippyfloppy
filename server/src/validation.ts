import { GROUP_TYPES, ITEM_STATUSES } from './types';

/**
 * Server-side input checks. Each validate* function returns an error message
 * for a 400 response, or null when the body is fine. The browser form checks
 * are only a convenience; these are the ones that actually protect the data.
 */

export const LIMITS = {
  name: 120, // item / group names
  category: 40, // item and expense categories
  person: 100, // buyer, seller ("bought from")
  notes: 1000,
  url: 500,
  credential: 200, // login username / password
  money: 10_000_000, // ₱10M: far above any real part or batch
  listSize: 200, // components in one batch, items in one sale, expenses in one request
} as const;

type Body = Record<string, unknown>;
type Problem = string | null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

function text(value: unknown, field: string, max: number, required: boolean): Problem {
  if (value === null || value === undefined || value === '') {
    return required ? `${field} is required` : null;
  }
  if (typeof value !== 'string') return `${field} must be text`;
  if (required && value.trim() === '') return `${field} is required`;
  if (value.length > max) return `${field} must be at most ${max} characters`;
  return null;
}

function money(value: unknown, field: string, nullable: boolean): Problem {
  if (value === null || value === undefined) return nullable ? null : `${field} is required`;
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return `${field} must be a number`;
  if (n < 0) return `${field} cannot be negative`;
  if (n > LIMITS.money) return `${field} is too large`;
  return null;
}

function date(value: unknown, field: string, nullable: boolean, dateOnly = false): Problem {
  if (value === null || value === undefined || value === '') return nullable ? null : `${field} is required`;
  if (typeof value !== 'string' || value.length > 40) return `${field} must be a date`;
  if (dateOnly && !DATE_ONLY_RE.test(value)) return `${field} must be a date (YYYY-MM-DD)`;
  if (Number.isNaN(Date.parse(value))) return `${field} must be a valid date`;
  return null;
}

function oneOf(value: unknown, field: string, allowed: readonly string[]): Problem {
  return typeof value === 'string' && allowed.includes(value) ? null : `${field} must be one of: ${allowed.join(', ')}`;
}

function url(value: unknown, field: string): Problem {
  const problem = text(value, field, LIMITS.url, false);
  if (problem || value === null || value === undefined || value === '') return problem;
  return /^https?:\/\//i.test(value as string) ? null : `${field} must start with http:// or https://`;
}

function list(value: unknown, field: string, required: boolean): Problem {
  if (value === undefined || value === null) return required ? `${field} is required` : null;
  if (!Array.isArray(value)) return `${field} must be a list`;
  if (required && value.length === 0) return `${field} must not be empty`;
  if (value.length > LIMITS.listSize) return `${field} can have at most ${LIMITS.listSize} entries`;
  return null;
}

/** First problem found, or null. */
function first(...problems: Problem[]): Problem {
  return problems.find((p) => p !== null) ?? null;
}

function expenseList(value: unknown, field: string, required: boolean): Problem {
  const problem = list(value, field, required);
  if (problem || !Array.isArray(value)) return problem;
  for (const [i, e] of value.entries()) {
    if (typeof e !== 'object' || e === null) return `${field}[${i}] must be an object`;
    const x = e as Body;
    const p = first(
      text(x.category, `${field}[${i}].category`, LIMITS.category, true),
      money(x.amount, `${field}[${i}].amount`, false),
      x.itemId === undefined || x.itemId === null || isUuid(x.itemId) ? null : `${field}[${i}].itemId must be an id`
    );
    if (p) return p;
  }
  return null;
}

// ---- auth ----

export function validateLogin(b: Body): Problem {
  return first(
    text(b.username, 'username', LIMITS.credential, true),
    text(b.password, 'password', LIMITS.credential, true)
  );
}

// ---- groups ----

const GROUP_PATCH_FIELDS = ['groupName', 'groupType', 'purchaseDate', 'baseCost', 'boughtFrom'];

export function validateGroupPatch(b: Body): Problem {
  const unknown = Object.keys(b).filter((k) => !GROUP_PATCH_FIELDS.includes(k));
  if (unknown.length) return `Unknown field(s): ${unknown.join(', ')}`;
  return first(
    b.groupName === undefined ? null : text(b.groupName, 'groupName', LIMITS.name, true),
    b.groupType === undefined ? null : oneOf(b.groupType, 'groupType', GROUP_TYPES),
    b.purchaseDate === undefined ? null : date(b.purchaseDate, 'purchaseDate', false, true),
    b.baseCost === undefined ? null : money(b.baseCost, 'baseCost', false),
    b.boughtFrom === undefined ? null : text(b.boughtFrom, 'boughtFrom', LIMITS.person, false)
  );
}

// ---- items ----

/** Only the keys the PATCH route may change; each one's rule. */
const ITEM_PATCH_RULES: Record<string, (v: unknown) => Problem> = {
  group_id: (v) => (v === null || isUuid(v) ? null : 'group_id must be an id or null'),
  name: (v) => text(v, 'name', LIMITS.name, true),
  category: (v) => text(v, 'category', LIMITS.category, true),
  status: (v) => oneOf(v, 'status', ITEM_STATUSES),
  assigned_cost: (v) => money(v, 'assigned_cost', false),
  listed_price: (v) => money(v, 'listed_price', true),
  sold_price: (v) => money(v, 'sold_price', true),
  notes: (v) => text(v, 'notes', LIMITS.notes, false),
  buyer_name: (v) => text(v, 'buyer_name', LIMITS.person, false),
  sale_date: (v) => date(v, 'sale_date', true),
  listing_url: (v) => url(v, 'listing_url'),
  purchase_date: (v) => date(v, 'purchase_date', true, true),
  bought_from: (v) => text(v, 'bought_from', LIMITS.person, false),
};

export function validateItemPatch(b: Body): Problem {
  const keys = Object.keys(b);
  if (keys.length === 0) return 'Nothing to update';
  const unknown = keys.filter((k) => !(k in ITEM_PATCH_RULES));
  if (unknown.length) return `Unknown field(s): ${unknown.join(', ')}`;
  return first(...keys.map((k) => ITEM_PATCH_RULES[k](b[k])));
}

export function validateCreateItem(b: Body): Problem {
  return first(
    isUuid(b.groupId) ? null : 'groupId must be an id',
    text(b.name, 'name', LIMITS.name, true),
    text(b.category, 'category', LIMITS.category, true),
    oneOf(b.status, 'status', ITEM_STATUSES),
    money(b.assignedCost ?? 0, 'assignedCost', false),
    text(b.notes, 'notes', LIMITS.notes, false)
  );
}

export function validateBatch(b: Body): Problem {
  const problem = first(
    text(b.groupName, 'groupName', LIMITS.name, true),
    oneOf(b.groupType, 'groupType', GROUP_TYPES),
    date(b.purchaseDate, 'purchaseDate', false, true),
    money(b.baseCost ?? 0, 'baseCost', false),
    text(b.boughtFrom, 'boughtFrom', LIMITS.person, false),
    expenseList(b.additionalExpenses, 'additionalExpenses', false),
    list(b.components, 'components', true)
  );
  if (problem) return problem;
  for (const [i, c] of (b.components as unknown[]).entries()) {
    if (typeof c !== 'object' || c === null) return `components[${i}] must be an object`;
    const x = c as Body;
    const p = first(
      text(x.name, `components[${i}].name`, LIMITS.name, true),
      text(x.category, `components[${i}].category`, LIMITS.category, true),
      oneOf(x.status, `components[${i}].status`, ITEM_STATUSES),
      money(x.assignedCost ?? 0, `components[${i}].assignedCost`, false),
      money(x.listedPrice, `components[${i}].listedPrice`, true),
      text(x.notes, `components[${i}].notes`, LIMITS.notes, false),
      url(x.listingUrl, `components[${i}].listingUrl`)
    );
    if (p) return p;
  }
  return null;
}

export function validateQuickAdd(b: Body): Problem {
  return first(
    text(b.name, 'name', LIMITS.name, true),
    text(b.category, 'category', LIMITS.category, true),
    oneOf(b.status, 'status', ITEM_STATUSES),
    date(b.purchaseDate, 'purchaseDate', false, true),
    text(b.boughtFrom, 'boughtFrom', LIMITS.person, false),
    money(b.baseCost ?? 0, 'baseCost', false),
    text(b.targetGroupName, 'targetGroupName', LIMITS.name, true),
    text(b.notes, 'notes', LIMITS.notes, false),
    url(b.listingUrl, 'listingUrl'),
    expenseList(b.additionalExpenses, 'additionalExpenses', false)
  );
}

export function validateSellBuild(b: Body): Problem {
  const prices = b.itemSoldPrices;
  if (typeof prices !== 'object' || prices === null || Array.isArray(prices)) return 'itemSoldPrices must be an object';
  const entries = Object.entries(prices as Body);
  if (entries.length === 0) return 'itemSoldPrices must not be empty';
  if (entries.length > LIMITS.listSize) return `A sale can have at most ${LIMITS.listSize} items`;
  for (const [id, price] of entries) {
    if (!isUuid(id)) return 'itemSoldPrices keys must be item ids';
    const p = money(price, 'sold price', false);
    if (p) return p;
  }
  return first(
    text(b.buyerName, 'buyerName', LIMITS.person, true),
    date(b.saleDate, 'saleDate', false),
    url(b.listingUrl, 'listingUrl')
  );
}

export function validateItemIds(b: Body): Problem {
  const problem = list(b.itemIds, 'itemIds', true);
  if (problem) return problem;
  return (b.itemIds as unknown[]).every(isUuid) ? null : 'itemIds must all be item ids';
}

// ---- expenses ----

export function validateAddExpenses(b: Body): Problem {
  return first(isUuid(b.groupId) ? null : 'groupId must be an id', expenseList(b.expenses, 'expenses', true));
}
