// app/sessions/page.tsx  (server component)
import Link from "next/link";
import { pool } from "@/lib/db";

export default async function SessionsPage() {
  try {
    const r = await pool.query(
      `SELECT id, title, status, created_at
       FROM "Session"
       ORDER BY created_at DESC
       LIMIT 100`
    );

    const sessions = r.rows || [];

    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Past Sessions</h1>
          <Link href="/sessions/record" className="px-3 py-2 rounded bg-primary text-primary-foreground">Start new</Link>
        </div>

        {sessions.length === 0 ? (
          <div className="p-6 bg-card rounded">No sessions yet.</div>
        ) : (
          <ul className="space-y-4">
            {sessions.map((s: any) => (
              <li key={s.id} className="p-4 border rounded-lg bg-card shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/sessions/${s.id}`} className="text-lg font-semibold text-primary-foreground">
                      {s.title || "Untitled Session"}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {s.preview ?? ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
                    <div className="mt-2 px-2 py-1 rounded-full bg-gray-100 text-xs">{s.status}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  } catch (err: any) {
    console.error("SessionsPage server error:", err);
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold">Error loading sessions</h1>
        <p className="text-sm text-red-600">{String(err?.message ?? err)}</p>
        <p className="text-sm text-muted-foreground">Check server logs and ensure your DATABASE_URL and DB connection are correct.</p>
      </div>
    );
  }
}
