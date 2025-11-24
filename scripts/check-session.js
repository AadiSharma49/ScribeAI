// scripts/check-session.js
// Usage: node scripts/check-session.js [OPTIONAL_SESSION_ID]
// Make sure DATABASE_URL is set in the environment before running.

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DATABASE_URL environment variable. Set it first.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run(id) {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Postgres OK');
    client.release();

    const recent = await pool.query(
      'SELECT id, title, status, created_at FROM "Session" ORDER BY created_at DESC LIMIT 10'
    );
    console.log('Recent sessions (up to 10):');
    console.table(recent.rows);

    if (id) {
      const res = await pool.query('SELECT * FROM "Session" WHERE id = $1', [id]);
      console.log(`\nQuery result for id=${id}:`);
      console.dir(res.rows, { depth: 4 });
    }
  } catch (err) {
    console.error('DB error:', err.message || err);
  } finally {
    await pool.end();
  }
}

run(process.argv[2]);
