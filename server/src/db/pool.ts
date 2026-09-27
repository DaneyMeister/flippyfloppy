import { Pool, types } from 'pg';
import 'dotenv/config';

// Return DATE columns (purchase_date) as the plain 'YYYY-MM-DD' text Postgres
// stores. By default pg turns them into a JS Date at local midnight, which in
// UTC+8 serialises to the previous day ("2026-09-11T16:00:00Z" for Sep 12),
// so edit forms showed, and re-saved, a date one day early.
const DATE_OID = 1082;
types.setTypeParser(DATE_OID, (value) => value);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
