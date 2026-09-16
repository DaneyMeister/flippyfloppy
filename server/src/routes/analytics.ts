import { Router } from 'express';
import * as analyticsService from '../services/analyticsService';

const router = Router();

router.get('/dashboard', async (_req, res) => {
  const summary = await analyticsService.getDashboardSummary();
  res.json(summary);
});

router.get('/monthly', async (req, res) => {
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ error: 'year and month (1-12) query params are required' });
  }
  const report = await analyticsService.getMonthlyReport(year, month);
  res.json(report);
});

router.get('/price-lookup', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const result = await analyticsService.priceLookup(q);
  res.json(result);
});

export default router;
