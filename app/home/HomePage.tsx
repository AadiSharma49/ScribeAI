// app/home/HomePage.tsx (server component)
import Link from "next/link";

export default function HomePage({ user }: { user?: any }) {
  return (
    <div className="container py-12">
      <div className="grid gap-10 md:grid-cols-[1.5fr,1fr] items-center">
        <section className="space-y-6">
          <span className="inline-flex items-center rounded-full border border-muted px-3 py-1 text-xs text-muted-foreground">
            ✨ AI-Powered Meeting Scribe
          </span>

          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Turn your meetings into{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              live transcripts
            </span>{" "}
            and action items.
          </h1>

          <p className="text-sm md:text-base text-muted-foreground max-w-xl">
            ScribeAI captures audio from your mic or meeting tab, streams it to
            Gemini for real-time transcription, and gives you clean summaries
            and decisions at the end.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/sessions/record" className="px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition">
              Start a new session
            </Link>

            <Link href="/sessions" className="px-4 py-2.5 rounded-full border border-muted text-sm text-muted-foreground hover:border-primary/70 hover:bg-muted/60 transition">
              View past sessions
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">Signed in as: {user?.email ?? "—"}</p>
        </section>

        <section className="relative">
          <div className="rounded-2xl border border-muted bg-card/80 p-4 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">Live Session</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Idle
              </span>
            </div>

            <div className="h-36 rounded-xl bg-gradient-to-br from-muted to-card border border-muted/70 overflow-hidden p-3 text-xs text-muted-foreground">
              <p className="opacity-60">
                Waiting to start a recording. Once you begin, transcript lines
                will appear here in real time.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
