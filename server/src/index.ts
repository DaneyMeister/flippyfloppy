import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import groupsRoutes from './routes/groups';
import itemsRoutes from './routes/items';
import expensesRoutes from './routes/expenses';
import analyticsRoutes from './routes/analytics';
import { requireAuth } from './middleware/auth';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);

// Everything below requires a valid JWT.
app.use('/api/groups', requireAuth, groupsRoutes);
app.use('/api/items', requireAuth, itemsRoutes);
app.use('/api/expenses', requireAuth, expensesRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`FlippyFloppy API listening on http://localhost:${port}`);
});
