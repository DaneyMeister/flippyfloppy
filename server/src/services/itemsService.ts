import { pool } from '../db/pool';
import { isSharedRunningCostGroup } from '../types';
import { recalculateGroupBaseCost, ensureSharedBucketGroupId, createGroup } from './groupsService';

export async function getAllItemsWithGroups() {
  const { rows } = await pool.query(`
    SELECT
      i.*,
      row_to_json(g.*) AS item_group
    FROM inventory_items i
    LEFT JOIN item_groups g ON g.id = i.group_id
    ORDER BY i.created_at DESC
  `);
  return rows;
}

export async function getItemById(id: string) {
  const { rows } = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [id]);
  return rows[0] ?? null;
}

/**
 * Creates a single item directly inside an existing group, then resyncs that
 * group's base_cost if it's a shared running-cost bucket. Mirrors the
 * Flutter app's group-editor "Add Component" dialog, which inserts straight
 * into inventory_items rather than going through the batch/quick-add flows.
 */
export async function createItemInGroup(data: {
  groupId: string;
  name: string;
  category: string;
  status: string;
  assignedCost: number;
  notes?: string | null;
}) {
  const { rows } = await pool.query(
    `INSERT INTO inventory_items (group_id, name, category, status, assigned_cost, listed_price, notes)
     VALUES ($1, $2, $3, $4, $5, $5, $6) RETURNING *`,
    [data.groupId, data.name, data.category, data.status, data.assignedCost, data.notes ?? null]
  );
  const item = rows[0];

  const groupName = await groupNameForItem(data.groupId);
  if (isSharedRunningCostGroup(groupName)) {
    await recalculateGroupBaseCost(data.groupId);
  }

  return item;
}

async function groupNameForItem(groupId: string | null): Promise<string | null> {
  if (!groupId) return null;
  const { rows } = await pool.query('SELECT group_name FROM item_groups WHERE id = $1', [groupId]);
  return rows[0]?.group_name ?? null;
}

export interface ComponentInput {
  name: string;
  category: string;
  status: string;
  assignedCost: number;
  listedPrice?: number | null;
  notes?: string | null;
  listingUrl?: string | null;
}

export interface ExpenseInput {
  category: string;
  amount: number;
}

/**
 * Creates a purchase batch: one item_group + its additional expenses + N
 * inventory_items, all in a single transaction. Mirrors
 * InventoryController.createBatch.
 */
export async function createBatch(data: {
  groupName: string;
  groupType: string;
  purchaseDate: string;
  baseCost: number;
  boughtFrom: string;
  additionalExpenses: ExpenseInput[];
  components: ComponentInput[];
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const groupResult = await client.query(
      `INSERT INTO item_groups (group_name, group_type, purchase_date, base_cost, bought_from)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.groupName, data.groupType, data.purchaseDate, data.baseCost, data.boughtFrom]
    );
    const group = groupResult.rows[0];

    const insertedExpenses = [];
    for (const expense of data.additionalExpenses) {
      const { rows } = await client.query(
        `INSERT INTO group_expenses (group_id, category, amount) VALUES ($1, $2, $3) RETURNING *`,
        [group.id, expense.category, expense.amount]
      );
      insertedExpenses.push(rows[0]);
    }

    const insertedItems = [];
    for (const component of data.components) {
      const { rows } = await client.query(
        `INSERT INTO inventory_items (group_id, name, category, status, assigned_cost, listed_price, notes, listing_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          group.id,
          component.name,
          component.category,
          component.status,
          component.assignedCost,
          component.listedPrice ?? component.assignedCost,
          component.notes ?? null,
          component.listingUrl ?? null,
        ]
      );
      insertedItems.push(rows[0]);
    }

    await client.query('COMMIT');
    return { group, expenses: insertedExpenses, items: insertedItems };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Quick-adds a single individually-bought item under a shared running-cost
 * bucket, then recalculates that bucket's derived base_cost. Mirrors
 * InventoryController.quickAddIndividualItem.
 */
export async function quickAddIndividualItem(data: {
  name: string;
  category: string;
  status: string;
  purchaseDate: string;
  boughtFrom: string;
  baseCost: number;
  targetGroupName: string;
  notes?: string | null;
  listingUrl?: string | null;
  additionalExpenses?: ExpenseInput[];
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let groupRes = await client.query('SELECT * FROM item_groups WHERE group_name = $1 LIMIT 1', [data.targetGroupName]);
    let group = groupRes.rows[0];
    if (!group) {
      const inserted = await client.query(
        `INSERT INTO item_groups (group_name, group_type, purchase_date, base_cost, bought_from)
         VALUES ($1, 'Individual', CURRENT_DATE, 0, NULL) RETURNING *`,
        [data.targetGroupName]
      );
      group = inserted.rows[0];
    }

    const itemRes = await client.query(
      `INSERT INTO inventory_items (group_id, name, category, status, assigned_cost, notes, listing_url, purchase_date, bought_from)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [group.id, data.name, data.category, data.status, data.baseCost, data.notes ?? null, data.listingUrl ?? null, data.purchaseDate, data.boughtFrom]
    );
    const item = itemRes.rows[0];

    const validExpenses = (data.additionalExpenses ?? []).filter((e) => e.amount >= 0);
    const insertedExpenses = [];
    for (const expense of validExpenses) {
      const { rows } = await client.query(
        `INSERT INTO group_expenses (group_id, item_id, category, amount) VALUES ($1, $2, $3, $4) RETURNING *`,
        [group.id, item.id, expense.category, expense.amount]
      );
      insertedExpenses.push(rows[0]);
    }

    const totalRes = await client.query(
      `SELECT COALESCE(SUM(assigned_cost), 0) AS total FROM inventory_items WHERE group_id = $1`,
      [group.id]
    );
    const total = Number(totalRes.rows[0].total);
    await client.query('UPDATE item_groups SET base_cost = $1 WHERE id = $2', [total, group.id]);

    await client.query('COMMIT');
    return { group: { ...group, base_cost: total }, item, expenses: insertedExpenses };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateItem(id: string, fields: Record<string, unknown>) {
  const previous = await getItemById(id);
  const oldGroupName = previous ? await groupNameForItem(previous.group_id) : null;

  const columns: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  const allowed = [
    'group_id', 'name', 'category', 'status', 'assigned_cost', 'listed_price',
    'sold_price', 'notes', 'buyer_name', 'sale_date', 'listing_url', 'purchase_date', 'bought_from',
  ];
  for (const key of allowed) {
    if (key in fields) {
      columns.push(`${key} = $${i++}`);
      values.push(fields[key]);
    }
  }
  if (columns.length > 0) {
    values.push(id);
    await pool.query(`UPDATE inventory_items SET ${columns.join(', ')} WHERE id = $${i}`, values);
  }

  const updated = await getItemById(id);
  const newGroupName = updated ? await groupNameForItem(updated.group_id) : null;

  if (isSharedRunningCostGroup(oldGroupName) && previous?.group_id) {
    await recalculateGroupBaseCost(previous.group_id);
  }
  if (newGroupName !== oldGroupName && isSharedRunningCostGroup(newGroupName) && updated?.group_id) {
    await recalculateGroupBaseCost(updated.group_id);
  }

  return updated;
}

export async function deleteItem(id: string) {
  const item = await getItemById(id);
  const groupName = item ? await groupNameForItem(item.group_id) : null;

  await pool.query('DELETE FROM inventory_items WHERE id = $1', [id]);

  if (isSharedRunningCostGroup(groupName) && item?.group_id) {
    await recalculateGroupBaseCost(item.group_id);
  }
}

/**
 * Sells multiple existing items together as one build: each item keeps its
 * own sold price but shares the same buyer/sale date/listing link, which is
 * how the client groups them back into one sale (matching buyer + date).
 */
export async function sellItemsAsBuild(data: {
  itemSoldPrices: Record<string, number>;
  buyerName: string;
  saleDate: string;
  listingUrl?: string | null;
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [itemId, soldPrice] of Object.entries(data.itemSoldPrices)) {
      const setListing = data.listingUrl && data.listingUrl.length > 0;
      await client.query(
        `UPDATE inventory_items
         SET status = 'SOLD', sold_price = $1, buyer_name = $2, sale_date = $3${setListing ? ', listing_url = $5' : ''}
         WHERE id = $4`,
        setListing
          ? [soldPrice, data.buyerName, data.saleDate, itemId, data.listingUrl]
          : [soldPrice, data.buyerName, data.saleDate, itemId]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Reverts a sale (one item or a whole build) back to available inventory,
 * clearing all sale fields -- mirrors InventoryController.returnSale.
 */
export async function returnSale(itemIds: string[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const id of itemIds) {
      await client.query(
        `UPDATE inventory_items
         SET status = 'SELLING', sold_price = NULL, buyer_name = NULL, sale_date = NULL, listing_url = NULL
         WHERE id = $1`,
        [id]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Re-exported so routes only need to import from one place.
export { ensureSharedBucketGroupId, createGroup };
