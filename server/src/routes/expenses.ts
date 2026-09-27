import { Router } from 'express';
import * as expensesService from '../services/expensesService';
import { recalculateGroupBaseCost } from '../services/groupsService';
import { pool } from '../db/pool';
import { isSharedRunningCostGroup } from '../types';
import { isUuid, validateAddExpenses } from '../validation';

const router = Router();

router.param('id', (_req, res, next, id) => {
  if (!isUuid(id)) return res.status(404).json({ error: 'Expense not found' });
  next();
});

router.post('/', async (req, res) => {
  try {
    const body = req.body ?? {};
    const invalid = validateAddExpenses(body);
    if (invalid) return res.status(400).json({ error: invalid });

    const { groupId, expenses } = body;
    const inserted = await expensesService.addGroupExpenses(groupId, expenses);

    const { rows } = await pool.query('SELECT group_name FROM item_groups WHERE id = $1', [groupId]);
    if (isSharedRunningCostGroup(rows[0]?.group_name)) {
      await recalculateGroupBaseCost(groupId);
    }

    res.status(201).json(inserted);
  } catch (err) {
    console.error('Add expenses failed:', err);
    res.status(500).json({ error: 'Failed to add expenses' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await expensesService.deleteGroupExpense(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error('Delete expense failed:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
