import { Pool } from 'pg';
import { config } from '../config/index.js';

export const pool = new Pool({
  connectionString: config.database.url,
});

// Test connection
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('PostgreSQL error:', err);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Query executed', { text: text.substring(0, 50), duration, rows: result.rowCount });
  return result;
};
