// app/api/sessions/[id]/download/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "txt";

  const r = await pool.query(
    `SELECT id, title, transcript FROM "Session" WHERE id=$1 LIMIT 1`,
    [id]
  );
  if (!r.rows[0]) return NextResponse.json({ ok: false }, { status: 404 });

  const row = r.rows[0];
  const transcript = row.transcript || "";

  if (format === "srt") {
    // Simple SRT: split by chunk markers if present, or by newline blocks.
    // This is a best-effort conversion; for accurate timestamps use chunk metadata.
    const lines = transcript.split(/\n{2,}/).filter(Boolean);
    let srt = "";
    let idx = 1;

    // fmt expects a number of seconds and returns "HH:MM:SS,000"
    const fmt = (s: number) => {
      const h = Math.floor(s / 3600).toString().padStart(2, "0");
      const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
      const sec = Math.floor(s % 60).toString().padStart(2, "0");
      return `${h}:${m}:${sec},000`;
    };

    for (const part of lines) {
      // placeholder timestamps: 00:00:00,000 -> 00:00:30,000 increments per item
      const start = (idx - 1) * 30;
      const end = idx * 30;
      srt += `${idx}\n${fmt(start)} --> ${fmt(end)}\n${part.trim()}\n\n`;
      idx++;
    }

    const res = new NextResponse(srt);
    res.headers.set("Content-Type", "application/x-subrip; charset=utf-8");
    res.headers.set(
      "Content-Disposition",
      `attachment; filename="${(row.title || row.id).replace(/"/g, "")}.srt"`
    );
    return res;
  }

  // default: txt
  const resTxt = new NextResponse(transcript);
  resTxt.headers.set("Content-Type", "text/plain; charset=utf-8");
  resTxt.headers.set(
    "Content-Disposition",
    `attachment; filename="${(row.title || row.id).replace(/"/g, "")}.txt"`
  );
  return resTxt;
}
