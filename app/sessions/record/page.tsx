// app/sessions/record/page.tsx
"use client";
import React, { useState } from "react";
import { useRecorder } from "../../../hooks/useRecorder";

export default function RecordPage() {
  const { state, sessionId, liveTranscript, error, lastAckSeq, start, pause, resume, stop } = useRecorder({
    timeSliceMs: 15000,
    maxUnacked: 3,
  });
  const [title, setTitle] = useState("Meeting " + new Date().toLocaleString());
  const [useTab, setUseTab] = useState(false);

  const getStatusColor = () => {
    switch (state) {
      case "recording": return "bg-red-500";
      case "paused": return "bg-yellow-500";
      case "starting": return "bg-blue-500";
      default: return "bg-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Gradient orbs for visual interest */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/25">
                SA
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-[#0a0a0f]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">ScribeAI</h1>
              <p className="text-sm text-slate-500">Real-time meeting transcription</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor()} ${state === "recording" ? "animate-pulse" : ""}`} />
            <span className="text-sm font-medium text-slate-300 capitalize">{state}</span>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Recording Panel */}
          <section className="lg:col-span-2 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl p-8">
            {/* Title Input */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Session Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder="Enter session title..."
              />
            </div>

            {/* Tab Audio Toggle */}
            <label className="inline-flex items-center gap-3 mb-8 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={useTab}
                  onChange={(e) => setUseTab(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-purple-500 transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Capture tab audio</span>
            </label>

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={() => start({ tab: useTab, title })}
                disabled={state === "recording" || state === "starting"}
                className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none transition-all"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                  Start
                </span>
              </button>
              <button
                onClick={() => pause()}
                disabled={state !== "recording"}
                className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none transition-all"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2V6a2 2 0 00-2-2H5zM13 4a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2V6a2 2 0 00-2-2h-2z" /></svg>
                  Pause
                </span>
              </button>
              <button
                onClick={() => resume()}
                disabled={state !== "paused"}
                className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none transition-all"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                  Resume
                </span>
              </button>
              <button
                onClick={() => stop()}
                disabled={state !== "recording" && state !== "paused"}
                className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none transition-all"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5z" /></svg>
                  Stop
                </span>
              </button>
            </div>

            {/* Session Info Bar */}
            <div className="flex items-center justify-between px-4 py-3 mb-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Session:</span>
                <code className="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-slate-300">{sessionId ?? "—"}</code>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Last ACK:</span>
                <code className="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-slate-300">{lastAckSeq ?? "—"}</code>
              </div>
            </div>

            {/* Transcript Area */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-500/10 to-transparent opacity-50 pointer-events-none" />
              <div className="h-72 overflow-auto p-5 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-sm">
                {liveTranscript.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <p>No transcript yet — start recording</p>
                  </div>
                ) : (
                  liveTranscript.map((t, i) => (
                    <div key={i} className="mb-3 pb-3 border-b border-white/5 last:border-0 text-sm text-slate-300 leading-relaxed">
                      {t}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              </div>
            )}

            {/* Note */}
            <p className="mt-6 text-xs text-slate-500 leading-relaxed">
              <span className="text-slate-400">Note:</span> Server currently returns stubbed transcripts until Gemini is integrated. Files are saved to <code className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400">tmp_sessions/&lt;sessionId&gt;</code> and chunk metadata stored in DB.
            </p>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Quick Checks Card */}
            <div className="rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Quick Checks
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-slate-500 block">Socket Server</span>
                    <code className="text-sm text-slate-300 font-mono">localhost:4000</code>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-slate-500 block">Database</span>
                    <span className="text-sm text-slate-300">Supabase</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-slate-500 block">Chunks Path</span>
                    <code className="text-sm text-slate-300 font-mono">./tmp_sessions/</code>
                  </div>
                </li>
              </ul>
            </div>

            {/* Screenshot Card */}
            <div className="rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl p-6">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Screenshot
              </h4>
              <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10">
                <img
                  alt="supabase screenshot"
                  src="/api/static/screenshot-placeholder"
                  className="w-full aspect-video object-cover opacity-80 hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                README screenshot saved at <code className="px-1 py-0.5 rounded bg-white/5 text-slate-400 text-[10px]">/mnt/data/Screenshot...png</code>
              </p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}