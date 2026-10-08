import { Pool, types } from 'pg';
import 'dotenv/config';

// Return DATE columns (purchase_date) as the plain 'YYYY-MM-DD' text Postgres
// stores. By default pg turns them into a JS Date at local midnight, which in
// UTC+8 serialises to the previous day ("2026-09-11T16:00:00Z" for Sep 12),
// so edit forms showed, and re-saved, a date one day early.
const DATE_OID = 1082;
types.setTypeParser(DATE_OID, (value) => value);

// Hosted Postgres (Render, Supabase, Neon, ...) usually requires SSL; set
// DATABASE_SSL=true there. Their certificates often don't chain to a public
// root, so the connection is encrypted without verifying the certificate.
// Leave it unset for a local database, which doesn't use SSL.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// Hosted databases close idle connections. Without a listener, the error that
// raises on an idle client crashes the whole process; log it instead; the pool
// replaces the client on the next query.
pool.on('error', (err) => {
  console.error('Idle database client error:', err.message);
});
