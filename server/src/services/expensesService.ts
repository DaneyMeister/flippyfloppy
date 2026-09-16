import { pool } from '../db/pool';

export async function addGroupExpenses(groupId: string, expenses: { category: string; amount: number; itemId?: string | null }[]) {
  const inserted = [];
  for (const expense of expenses.filter((e) => e.amount >= 0)) {
    const { rows } = await pool.query(
      `INSERT INTO group_expenses (group_id, item_id, category, amount) VALUES ($1, $2, $3, $4) RETURNING *`,
      [groupId, expense.itemId ?? null, expense.category, expense.amount]
    );
    inserted.push(rows[0]);
  }
  return inserted;
}

export async function deleteGroupExpense(id: string) {
  await pool.query('DELETE FROM group_expenses WHERE id = $1', [id]);
}
