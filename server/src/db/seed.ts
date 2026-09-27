import fs from 'fs';
import path from 'path';
import { pool } from './pool';

/**
 * Loads the invented sample data in seed.sql. Every row has a fixed ID and
 * the inserts use ON CONFLICT DO NOTHING, so running it twice is harmless.
 */
async function seed() {
  const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Sample data loaded.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
