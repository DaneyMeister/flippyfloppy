import { Router } from 'express';
import * as analyticsService from '../services/analyticsService';
import { LIMITS } from '../validation';

const router = Router();

router.get('/dashboard', async (_req, res) => {
  try {
    const summary = await analyticsService.getDashboardSummary();
    res.json(summary);
  } catch (err) {
    console.error('Dashboard failed:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.get('/monthly', async (req, res) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'year (2000-2100) and month (1-12) query params are required' });
    }
    const report = await analyticsService.getMonthlyReport(year, month);
    res.json(report);
  } catch (err) {
    console.error('Monthly report failed:', err);
    res.status(500).json({ error: 'Failed to load monthly report' });
  }
});

router.get('/price-lookup', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    if (q.length > LIMITS.name) return res.status(400).json({ error: `Search text must be at most ${LIMITS.name} characters` });
    const result = await analyticsService.priceLookup(q);
    res.json(result);
  } catch (err) {
    console.error('Price lookup failed:', err);
    res.status(500).json({ error: 'Failed to search prices' });
  }
});

export default router;
