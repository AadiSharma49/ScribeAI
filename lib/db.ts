// lib/db.ts
// Improved Postgres pool with safe SSR usage + debugging output.

import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL ?? "";

if (!connectionString) {
  console.error("❌ lib/db.ts: Missing DATABASE_URL environment variable");
}

// Create pool (safe for SSR)
export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// Run connection test once
(async () => {
  if (!connectionString) return;
  try {
    const client = await pool.connect();
    console.log("✅ lib/db.ts: Connected to Postgres successfully");
    client.release();
  } catch (err: any) {
    console.error("❌ lib/db.ts: FAILED to connect to Postgres:", err.message);
  }
})();

/**
 * Fetch session + chunks safely.
 */
export async function getSessionData(id: string) {
  try {
    const sessionRes = await pool.query(
      `SELECT * FROM "Session" WHERE id = $1 LIMIT 1`,
      [id]
    );

    const chunksRes = await pool.query(
      `SELECT * FROM "TranscriptChunk" WHERE session_id = $1 ORDER BY seq ASC`,
      [id]
    );

    return {
      session: sessionRes.rows[0] ?? null,
      chunks: chunksRes.rows ?? [],
    };
  } catch (err: any) {
    console.error(
      "❌ getSessionData error for session id:",
      id,
      "\nDB Error:",
      err.message
    );
    throw err;
  }
}
