import fs from 'fs';
import path from 'path';
import { pool } from './pool';

const DATA_DIR = path.join(__dirname, '..', '..', '..', 'migration_data');

interface SupabaseGroup {
  id: string;
  created_at: string;
  group_name: string;
  group_type: string;
  purchase_date: string;
  base_cost: number;
  bought_from: string | null;
}

interface SupabaseItem {
  id: string;
  created_at: string;
  name: string;
  category: string;
  status: string;
  assigned_cost: number;
  listed_price: number | null;
  sold_price: number | null;
  buyer_name: string | null;
  sale_date: string | null;
  notes: string | null;
  group_id: string | null;
  listing_url: string | null;
  purchase_date: string | null;
  bought_from: string | null;
}

interface SupabaseExpense {
  id: string;
  created_at: string;
  category: string;
  amount: number;
  group_id: string;
  item_id: string | null;
}

function loadJson<T>(filename: string): T[] {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8'));
}

async function importData() {
  const groups = loadJson<SupabaseGroup>('item_groups.json');
  const items = loadJson<SupabaseItem>('inventory_items.json');
  const expenses = loadJson<SupabaseExpense>('group_expenses.json');

  console.log(`Importing ${groups.length} groups, ${items.length} items, ${expenses.length} expenses...`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Wipe existing data so this script is safely re-runnable.
    await client.query('DELETE FROM group_expenses');
    await client.query('DELETE FROM inventory_items');
    await client.query('DELETE FROM item_groups');

    for (const g of groups) {
      await client.query(
        `INSERT INTO item_groups (id, group_name, group_type, purchase_date, base_cost, bought_from, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [g.id, g.group_name, g.group_type, g.purchase_date, g.base_cost, g.bought_from, g.created_at]
      );
    }

    for (const i of items) {
      await client.query(
        `INSERT INTO inventory_items
           (id, group_id, name, category, status, assigned_cost, listed_price, sold_price, notes, buyer_name, sale_date, listing_url, purchase_date, bought_from, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          i.id, i.group_id, i.name, i.category, i.status, i.assigned_cost, i.listed_price, i.sold_price,
          i.notes, i.buyer_name, i.sale_date, i.listing_url, i.purchase_date, i.bought_from, i.created_at,
        ]
      );
    }

    for (const e of expenses) {
      await client.query(
        `INSERT INTO group_expenses (id, group_id, item_id, category, amount, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [e.id, e.group_id, e.item_id, e.category, e.amount, e.created_at]
      );
    }

    await client.query('COMMIT');
    console.log('Import complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

importData().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
