import { pool } from '../db/pool';
import { BOUGHT_COMPONENTS_GROUP_NAME } from '../types';

export async function getAllGroups() {
  const { rows } = await pool.query(`
    SELECT
      g.*,
      COALESCE(
        json_agg(e.*) FILTER (WHERE e.id IS NOT NULL),
        '[]'
      ) AS group_expenses
    FROM item_groups g
    LEFT JOIN group_expenses e ON e.group_id = g.id
    GROUP BY g.id
    ORDER BY g.purchase_date DESC
  `);
  return rows;
}

export async function getGroupById(id: string) {
  const { rows } = await pool.query(
    `
    SELECT
      g.*,
      COALESCE(
        json_agg(e.*) FILTER (WHERE e.id IS NOT NULL),
        '[]'
      ) AS group_expenses
    FROM item_groups g
    LEFT JOIN group_expenses e ON e.group_id = g.id
    WHERE g.id = $1
    GROUP BY g.id
    `,
    [id]
  );
  return rows[0] ?? null;
}

export async function findGroupByName(groupName: string) {
  const { rows } = await pool.query('SELECT * FROM item_groups WHERE group_name = $1 LIMIT 1', [groupName]);
  return rows[0] ?? null;
}

export async function createGroup(data: {
  groupName: string;
  groupType: string;
  purchaseDate: string;
  baseCost: number;
  boughtFrom: string | null;
}) {
  const { rows } = await pool.query(
    `INSERT INTO item_groups (group_name, group_type, purchase_date, base_cost, bought_from)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [data.groupName, data.groupType, data.purchaseDate, data.baseCost, data.boughtFrom]
  );
  return rows[0].id as string;
}

export async function updateGroup(
  id: string,
  data: Partial<{
    groupName: string;
    groupType: string;
    purchaseDate: string;
    baseCost: number;
    boughtFrom: string | null;
  }>
) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (data.groupName !== undefined) { fields.push(`group_name = $${i++}`); values.push(data.groupName); }
  if (data.groupType !== undefined) { fields.push(`group_type = $${i++}`); values.push(data.groupType); }
  if (data.purchaseDate !== undefined) { fields.push(`purchase_date = $${i++}`); values.push(data.purchaseDate); }
  if (data.baseCost !== undefined) { fields.push(`base_cost = $${i++}`); values.push(data.baseCost); }
  if (data.boughtFrom !== undefined) { fields.push(`bought_from = $${i++}`); values.push(data.boughtFrom); }

  if (fields.length === 0) return getGroupById(id);

  values.push(id);
  await pool.query(`UPDATE item_groups SET ${fields.join(', ')} WHERE id = $${i}`, values);
  return getGroupById(id);
}

/**
 * Recomputes a shared running-cost bucket's base_cost as the sum of its
 * items' assigned_cost, mirroring InventoryController._recalculateGroupBaseCost.
 */
export async function recalculateGroupBaseCost(groupId: string) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(assigned_cost), 0) AS total FROM inventory_items WHERE group_id = $1`,
    [groupId]
  );
  const total = Number(rows[0].total);
  await pool.query('UPDATE item_groups SET base_cost = $1 WHERE id = $2', [total, groupId]);
  return total;
}

/**
 * Finds a shared running-cost bucket group by name, creating it on first
 * use if it doesn't exist yet.
 */
export async function ensureSharedBucketGroupId(groupName: string = BOUGHT_COMPONENTS_GROUP_NAME) {
  const existing = await findGroupByName(groupName);
  if (existing) return existing.id as string;

  return createGroup({
    groupName,
    groupType: 'Individual',
    purchaseDate: new Date().toISOString().slice(0, 10),
    baseCost: 0,
    boughtFrom: null,
  });
}
