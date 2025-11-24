// pages/api/sessions/[id]/download.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../../../../lib/db"; // relative to pages/api/sessions/[id]

function makeTXT(session: any, chunks: any[]) {
  // Aggregate chunk texts (fallback to placeholders)
  const lines: string[] = [];
  chunks.forEach((c) => {
    const text = c.text ?? `[chunk ${c.seq}]`;
    lines.push(`-- CHUNK ${c.seq} --\n${text}\n`);
  });
  return `Session: ${session.title ?? "Untitled"}\nSession ID: ${session.id}\n\n${lines.join("\n")}`;
}

function secondsToSrtTime(s: number) {
  const pad = (n: number, z = 2) => String(n).padStart(z, "0");
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${pad(h,2)}:${pad(m,2)}:${pad(sec,2)},${String(ms).padStart(3,'0')}`;
}

function makeSRT(session: any, chunks: any[], chunkLengthSec = 15) {
  // If chunk timestamps aren't available we approximate by seq*chunkLength
  const parts: string[] = [];
  chunks.forEach((c, idx) => {
    const start = idx * chunkLengthSec;
    const end = start + chunkLengthSec;
    const text = c.text ?? `[chunk ${c.seq}]`;
    parts.push(`${idx + 1}\n${secondsToSrtTime(start)} --> ${secondsToSrtTime(end)}\n${text}\n`);
  });
  return parts.join("\n");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const format = (req.query.format as string) || "txt";

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ ok: false, error: "invalid session id" });
  }

  try {
    const sessionRes = await pool.query(`SELECT id, title, status, transcript FROM "Session" WHERE id = $1 LIMIT 1`, [id]);
    const session = sessionRes.rows[0];
    if (!session) return res.status(404).json({ ok: false, error: "session not found" });

    const chunksRes = await pool.query(`SELECT seq, text, filename FROM "TranscriptChunk" WHERE session_id = $1 ORDER BY seq ASC`, [id]);
    const chunks = chunksRes.rows ?? [];

    if (format === "srt") {
      const srt = makeSRT(session, chunks);
      res.setHeader("Content-Type", "application/x-subrip; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="session-${id}.srt"`);
      return res.send(srt);
    }

    // default: txt
    const txt = makeTXT(session, chunks);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="session-${id}.txt"`);
    return res.send(txt);
  } catch (err: any) {
    console.error("Download API error:", err?.message ?? err);
    return res.status(500).json({ ok: false, error: String(err?.message ?? err) });
  }
}
