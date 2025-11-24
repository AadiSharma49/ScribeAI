// components/RecorderUI.tsx
"use client";
import { useState } from "react";
import { useRecorder } from "@/hooks/useRecorder";

export default function RecorderUI() {
  const recorder = useRecorder({ timeSliceMs: 15000, maxUnacked: 3 });
  const [title, setTitle] = useState("");

  async function handleStart(tab=false) {
    await recorder.start({ title: title || `Meeting ${new Date().toLocaleString()}`, tab });
  }
  async function handleStop() { await recorder.stop(); }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Session title (optional)" className="p-2 border rounded flex-1 bg-white text-black" />
        <button onClick={()=>handleStart(false)} className="px-3 py-2 bg-green-600 text-white rounded">Start (mic)</button>
        <button onClick={()=>handleStart(true)} className="px-3 py-2 bg-indigo-600 text-white rounded">Start (tab)</button>
        <button onClick={handleStop} className="px-3 py-2 bg-red-600 text-white rounded">Stop</button>
      </div>

      <div>
        <div className="mb-2 text-sm text-muted-foreground">State: <strong>{recorder.state}</strong></div>
        <div className="p-3 border rounded h-40 overflow-auto bg-gray-50">
          {recorder.liveTranscript.length === 0 ? (
            <div className="text-sm text-muted-foreground">No live transcript yet. Press Start to begin.</div>
          ) : (
            recorder.liveTranscript.map((t, i) => <div key={i} className="text-sm py-1 border-b last:border-b-0">{t}</div>)
          )}
        </div>
      </div>

      {recorder.error && <div className="text-sm text-red-500">Error: {recorder.error}</div>}
    </div>
  );
}
