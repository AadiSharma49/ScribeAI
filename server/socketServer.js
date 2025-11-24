// server/socketServer.js
// Simple Socket.io server storing audio chunks to disk and metadata to Postgres
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const PORT = process.env.SOCKET_PORT || 4000;
const TMP_DIR = path.join(__dirname, '..', 'tmp_sessions');
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change";

// Ensure tmp dir exists
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Postgres pool using DATABASE_URL from .env
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL in environment");
  process.exit(1);
}

// Force SSL for Supabase (rejectUnauthorized: false avoids cert issues)
const pool = new Pool({
  connectionString,
  ssl: (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1') ? { rejectUnauthorized: false } : false,
});

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET","POST"],
  },
});

// Helper: parse cookie and attach userId to socket
function attachUserFromCookie(socket) {
  try {
    const raw = socket.handshake?.headers?.cookie || "";
    if (!raw) {
      socket.userId = null;
      return;
    }
    const parsed = cookie.parse(raw);
    const token = parsed.sa_session || parsed.session || parsed.SA_SESSION;
    if (!token) {
      socket.userId = null;
      return;
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.userId = payload?.sub ?? null;
    } catch (err) {
      console.warn(`[socket] invalid jwt for socket ${socket.id}:`, err.message);
      socket.userId = null;
    }
  } catch (err) {
    console.error("[socket] error parsing cookie:", err);
    socket.userId = null;
  }
}

io.on('connection', (socket) => {
  attachUserFromCookie(socket); // sets socket.userId or null
  console.log('client connected', socket.id, `user=${socket.userId ?? "anonymous"}`);

  socket.on('start-session', async (payload, cb) => {
    // payload: { sessionId (optional), title }
    try {
      const sessionId = payload?.sessionId || require('crypto').randomUUID();
      const title = payload?.title || null;
      const userId = socket.userId || null;

      // Create session record in DB (store user_id when available)
      const res = await pool.query(
        `INSERT INTO "Session"(id, user_id, title, status, created_at) VALUES ($1, $2, $3, $4, now()) RETURNING id`,
        [sessionId, userId, title, 'recording']
      );

      console.log(`[socket] created session ${res.rows[0].id} user=${userId}`);
      cb && cb({ ok: true, sessionId: res.rows[0].id });
    } catch (err) {
      console.error('start-session error', err);
      cb && cb({ ok: false, error: String(err) });
    }
  });

  socket.on('audio-chunk', async (meta, arrayBuffer, ack) => {
    // meta: { sessionId, seq, mimeType, startTimeMs }
    try {
      const { sessionId, seq, mimeType } = meta || {};
      if (!sessionId) {
        ack && ack({ ok: false, error: 'missing sessionId' });
        return;
      }
      if (typeof seq === 'undefined') {
        ack && ack({ ok: false, error: 'missing seq' });
        return;
      }

      // convert incoming ArrayBuffer/Buffer
      const buffer = Buffer.from(arrayBuffer);
      // save to disk
      const sessionDir = path.join(TMP_DIR, sessionId);
      if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
      const filename = `chunk-${String(seq).padStart(6,'0')}.webm`;
      const filePath = path.join(sessionDir, filename);
      fs.writeFileSync(filePath, buffer);

      // insert chunk metadata to DB
      await pool.query(
        `INSERT INTO "TranscriptChunk"(session_id, seq, filename, created_at) VALUES ($1, $2, $3, now())`,
        [sessionId, seq, filename]
      );

      // ack
      ack && ack({ ok: true, seq });

      // (Stub) produce a transcript delta back to client — replace with real Gemini call later
      const stubText = `Stub transcript for chunk ${seq}`;
      socket.emit('transcript-delta', {
        sessionId,
        seq,
        text: stubText,
        startMs: meta.startTimeMs ?? 0,
        endMs: (meta.startTimeMs ?? 0) + 15000,
      });
    } catch (err) {
      console.error('audio-chunk error', err);
      ack && ack({ ok: false, error: String(err) });
    }
  });

  // fast, reliable recording-stopped handler (non-blocking)
  socket.on('recording-stopped', async (payload, cb) => {
    try {
      const { sessionId } = payload || {};
      if (!sessionId) {
        cb && cb({ ok: false, error: 'missing sessionId' });
        return;
      }

      console.log(`[socket] recording-stopped for session=${sessionId} (user=${socket.userId ?? "anonymous"})`);

      // 1) mark processing (fast)
      await pool.query(`UPDATE "Session" SET status='processing' WHERE id = $1`, [sessionId]);

      // 2) notify client immediately that processing started
      socket.emit('processing', { sessionId });

      // 3) FAST PATH: write stub transcript/summary so UI can complete quickly.
      // This is non-blocking for the client; later you can run a full transcription job.
      const stubTranscript = `Stub transcript (real transcription disabled).`;
      const stubSummary = `Summary not generated (transcription disabled).`;

      await pool.query(
        `UPDATE "Session" SET status='completed', transcript=$1, summary=$2 WHERE id=$3`,
        [stubTranscript, stubSummary, sessionId]
      );

      // 4) emit completed to the same socket so client receives it
      socket.emit('completed', {
        sessionId,
        transcript: stubTranscript,
        summary: stubSummary,
        downloadUrl: `/api/sessions/${sessionId}/download`,
      });

      console.log(`[socket] session ${sessionId} completed (fast path)`);

      // 5) ack the client's callback
      cb && cb({ ok: true });

      // 6) (optional) Kick off background worker to re-process with real ASR/Gemini if configured
      (async function backgroundProcess() {
        try {
          // placeholder: you can implement real transcription here later.
          // e.g. read files from tmp_sessions/<sessionId>, send to Gemini or Whisper,
          // update TranscriptChunk.text and Session.transcript/summary and emit completed again.
        } catch (err) {
          console.error("[socket][backgroundProcess] error for session", sessionId, err);
          try { await pool.query(`UPDATE "Session" SET status='error' WHERE id=$1`, [sessionId]); } catch {}
          socket.emit('processing-error', { sessionId, error: String(err) });
        }
      })();

    } catch (err) {
      console.error('recording-stopped error (fast-flow)', err);
      cb && cb({ ok: false, error: String(err) });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('client disconnected', socket.id, reason);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket server listening on port ${PORT}`);
});
