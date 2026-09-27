import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth';
import groupsRoutes from './routes/groups';
import itemsRoutes from './routes/items';
import expensesRoutes from './routes/expenses';
import analyticsRoutes from './routes/analytics';
import { requireAuth } from './middleware/auth';

const app = express();

// Security headers (no sniffing, no framing, strict referrer, hides "X-Powered-By: Express", ...).
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);

// Everything below requires a valid JWT.
app.use('/api/groups', requireAuth, groupsRoutes);
app.use('/api/items', requireAuth, itemsRoutes);
app.use('/api/expenses', requireAuth, expensesRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Bad input from the client (broken JSON, oversized body) is a 4xx, not a server fault.
  const type = (err as { type?: string })?.type;
  if (type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON' });
  if (type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`FlippyFloppy API listening on http://localhost:${port}`);
});
