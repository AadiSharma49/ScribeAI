// server/worker/processSession.js
// Usage: node server/worker/processSession.js <sessionId>
// This is a simple background worker stub. Replace "transcribeChunk" with real ASR/Gemini call.

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const TMP_DIR = path.join(__dirname, '..', 'tmp_sessions');
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1') ? { rejectUnauthorized: false } : false,
});

async function transcribeChunkStub(filePath, seq) {
  // stub: pretend we transcribed the file by returning a placeholder line.
  // Replace this with an actual transcription call (Gemini/Whisper) later.
  return `Transcribed text for chunk ${seq} (file ${path.basename(filePath)})`;
}

async function processSession(sessionId) {
  console.log(`[worker] processing session ${sessionId}`);
  const sessionDir = path.join(TMP_DIR, sessionId);

  // 1) read chunk rows to get seq order
  const chunksRes = await pool.query(
    `SELECT id, seq, filename, text FROM "TranscriptChunk" WHERE session_id=$1 ORDER BY seq ASC`,
    [sessionId]
  );

  let aggregatedParts = [];
  for (const r of chunksRes.rows) {
    const filename = r.filename;
    const seq = r.seq;
    const filePath = filename ? path.join(sessionDir, filename) : null;
    let text = r.text;
    if (!text) {
      if (filePath && fs.existsSync(filePath)) {
        // call the transcriber (stub)
        try {
          text = await transcribeChunkStub(filePath, seq);
        } catch (err) {
          console.error(`[worker] transcribeChunk failed for ${filePath}`, err);
          text = `[failed to transcribe chunk ${seq}]`;
        }
      } else {
        text = `[no audio available for chunk ${seq}]`;
      }

      // persist chunk text
      try {
        await pool.query(
          `UPDATE "TranscriptChunk" SET text=$1 WHERE id=$2`,
          [text, r.id]
        );
      } catch (err) {
        console.warn(`[worker] failed to update chunk text for ${r.id}`, err);
      }
    }
    aggregatedParts.push(`--- chunk ${seq} ---\n${text}`);
  }

  // 2) assemble final transcript and summary (summary is stub)
  const aggregated = aggregatedParts.join("\n\n");
  const summary = `Auto-generated summary stub: ${aggregatedParts.length} chunks processed.`;

  // 3) update session
  await pool.query(
    `UPDATE "Session" SET transcript=$1, summary=$2, status='completed' WHERE id=$3`,
    [aggregated, summary, sessionId]
  );

  console.log(`[worker] session ${sessionId} processed. Updated DB.`);

  // optionally: you could notify clients via socket (not implemented here).
}

if (require.main === module) {
  const sid = process.argv[2];
  if (!sid) {
    console.error("Usage: node server/worker/processSession.js <sessionId>");
    process.exit(1);
  }
  processSession(sid)
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(2); });
}

module.exports = { processSession };
