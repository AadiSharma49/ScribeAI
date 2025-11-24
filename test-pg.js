// test-pg.js
const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // required for Supabase
  });

  try {
    const r = await pool.query('SELECT now() AS now');
    console.log('connected OK — now:', r.rows[0].now);
  } catch (err) {
    console.error('PG CONNECT ERROR:', err.message || err);
  } finally {
    await pool.end();
  }
})();