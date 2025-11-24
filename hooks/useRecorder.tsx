// hooks/useRecorder.tsx
import { useEffect, useRef, useState } from "react";
import { getSocket } from "../lib/socket";
import { blobToArrayBuffer, detectSupportedMime } from "../lib/audio";

export type RecorderState = "idle" | "starting" | "recording" | "paused" | "processing" | "completed" | "error";

type QueueItem = {
  seq: number;
  ab: ArrayBuffer;
  filename?: string;
  retries?: number;
  sessionIdAtEnqueue?: string | null;
};

export function useRecorder(opts?: {
  timeSliceMs?: number; // how long each chunk is in ms
  maxUnacked?: number; // backpressure
}) {
  const timeSliceMs = opts?.timeSliceMs ?? 15000; // 15s default
  const maxUnacked = opts?.maxUnacked ?? 3;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const seqRef = useRef<number>(0);
  const socketRef = useRef(getSocket());
  const unackedCountRef = useRef<number>(0);
  const pendingQueueRef = useRef<QueueItem[]>([]);
  const isFlushingRef = useRef(false);

  // keep sessionId in both state and ref so synchronous code can read it
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  const [state, setState] = useState<RecorderState>("idle");
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastAckSeq, setLastAckSeq] = useState<number | null>(null);

  useEffect(() => {
    const s = socketRef.current;
    function onTranscriptDelta(d: any) {
      if (d && d.text) setLiveTranscript((p) => [...p, d.text]);
    }
    s.on("transcript-delta", onTranscriptDelta);
    s.on("processing", () => setState("processing"));
    s.on("completed", (d) => {
      setState("completed");
      if (d?.transcript) setLiveTranscript((p) => [...p, "\n--- FINAL TRANSCRIPT ---\n", d.transcript]);
    });
    s.on("connect_error", (err: any) => {
      console.warn("socket connect_error", err);
      setError(String(err?.message || err));
    });
    return () => {
      s.off("transcript-delta", onTranscriptDelta);
      s.off("processing");
      s.off("completed");
      s.off("connect_error");
    };
  }, []);

  // Helper to send buffered chunks respecting backpressure
  async function tryFlushQueue() {
    if (isFlushingRef.current) return;
    isFlushingRef.current = true;
    const s = socketRef.current;

    try {
      while (pendingQueueRef.current.length > 0 && unackedCountRef.current < maxUnacked) {
        const item = pendingQueueRef.current.shift()!;
        unackedCountRef.current++;
        const targetSessionId = item.sessionIdAtEnqueue ?? sessionIdRef.current;

        s.emit(
          "audio-chunk",
          { sessionId: targetSessionId, seq: item.seq, mimeType: detectSupportedMime(), startTimeMs: 0 },
          item.ab,
          (ack: any) => {
            unackedCountRef.current = Math.max(0, unackedCountRef.current - 1);

            if (!ack?.ok) {
              const errMsg = ack?.error || "unknown server ack error";
              console.error("chunk ack error", ack);
              setError(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));

              // retry per item up to 3 times (per-session)
              item.retries = (item.retries ?? 0) + 1;
              if (item.retries <= 3) {
                const delay = 1000 * Math.pow(2, item.retries - 1);
                setTimeout(() => {
                  // only requeue if session still matches the one used when enqueued
                  if ((item.sessionIdAtEnqueue ?? null) === sessionIdRef.current) {
                    pendingQueueRef.current.unshift(item);
                    tryFlushQueue();
                  } else {
                    // session changed — do not requeue across sessions
                    console.warn(`not requeuing seq=${item.seq} because session changed`);
                  }
                }, delay);
              } else {
                console.error(`chunk seq=${item.seq} failed after ${item.retries} retries — dropping`);
              }
            } else {
              setLastAckSeq(item.seq);
              setError(null);
            }

            // schedule another pass
            setTimeout(() => tryFlushQueue(), 0);
          }
        );
      }
    } finally {
      isFlushingRef.current = false;
    }
  }

  async function start(options?: { tab?: boolean; title?: string }) {
    setError(null);
    setState("starting");
    try {
      const s = socketRef.current;

      // clear any old pending queue to avoid cross-session mixing
      pendingQueueRef.current = [];
      seqRef.current = 0;
      unackedCountRef.current = 0;

      // request session creation
      await new Promise<void>((resolve, reject) => {
        s.emit("start-session", { title: options?.title || "Untitled" }, (res: any) => {
          if (res?.ok && res?.sessionId) {
            setSessionId(res.sessionId);
            sessionIdRef.current = res.sessionId;
            resolve();
          } else {
            reject(new Error(res?.error || "start-session failed"));
          }
        });
      });

      // get media stream
      let stream: MediaStream | null = null;
      try {
        stream = await (navigator.mediaDevices as any).getUserMedia({ audio: true, video: false });
      } catch (err) {
        stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: false, audio: true });
      }
      if (!stream) throw new Error("Unable to acquire media stream");

      streamRef.current = stream;
      const mime = detectSupportedMime();
      const mr = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = async (ev: BlobEvent) => {
        if (!ev.data || ev.data.size === 0) return;
        seqRef.current += 1;
        const seq = seqRef.current;
        const ab = await blobToArrayBuffer(ev.data);
        // attach the sessionId at enqueue time
        const sid = sessionIdRef.current ?? null;
        pendingQueueRef.current.push({ seq, ab, retries: 0, sessionIdAtEnqueue: sid });
        tryFlushQueue();
      };

      mr.onerror = (ev) => {
        console.error("MediaRecorder error", ev);
        setError("MediaRecorder error");
        setState("error");
      };

      mr.onstart = () => setState("recording");
      mr.onpause = () => setState("paused");
      mr.onresume = () => setState("recording");

      mr.start(timeSliceMs);
      setState("recording");
    } catch (err: any) {
      console.error("start error", err);
      setError(String(err?.message || err));
      setState("error");
    }
  }

  async function pause() {
    try {
      mediaRecorderRef.current?.pause();
      setState("paused");
    } catch (e) {
      console.error(e);
    }
  }

  async function resume() {
    try {
      mediaRecorderRef.current?.resume();
      setState("recording");
    } catch (e) {
      console.error(e);
    }
  }

 async function stop() {
  try {
    setState("processing");
    mediaRecorderRef.current?.stop();
    // stop tracks
    streamRef.current?.getTracks().forEach((t) => t.stop());

    // flush remaining queue (bounded)
    const maxWaitMs = 20_000; // wait up to 20s for flushing
    const start = Date.now();
    while ((pendingQueueRef.current.length > 0 || unackedCountRef.current > 0) && Date.now() - start < maxWaitMs) {
      await new Promise((res) => setTimeout(res, 200));
    }

    const s = socketRef.current;

    // Set up a one-time completed listener and a timeout fallback
    let completedReceived = false;
    function onCompleted(payload: any) {
      completedReceived = true;
      // Ensure UI will update when completed arrives
      if (payload?.transcript) {
        setLiveTranscript((p) => [...p, "\n--- FINAL TRANSCRIPT ---\n", payload.transcript]);
      }
      setState("completed");
      setError(null);
      // remove listener
      s.off("completed", onCompleted);
      clearTimeout(fallbackTimer);
    }
    s.on("completed", onCompleted);

    // fallback: if no completed event in N ms, mark completed with stub
    const fallbackMs = 8000; // 8 seconds fallback
    const fallbackTimer = setTimeout(() => {
      if (!completedReceived) {
        // cleanup listener
        s.off("completed", onCompleted);
        // write a local stub so UI doesn't hang
        const stubTranscript = "Stub transcript (no server response).";
        setLiveTranscript((p) => [...p, "\n--- FINAL TRANSCRIPT ---\n", stubTranscript]);
        setState("completed");
        setError("Server did not respond quickly; showing stub result.");
      }
    }, fallbackMs);

    // Tell server recording ended (callback will still be invoked by server)
    await new Promise<void>((resolve) => {
      s.emit("recording-stopped", { sessionId }, (res: any) => {
        // server ack — but we still wait for 'completed' event to arrive or fallback to run
        resolve();
      });
    });

    // Note: do not setState("completed") here — wait for server 'completed' or fallback
  } catch (err) {
    console.error(err);
    setError(String(err));
    setState("error");
  }
}


  // cleanup on unmount
  useEffect(() => {
    return () => {
      try { mediaRecorderRef.current?.stop(); } catch {}
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    };
  }, []);

  return {
    state,
    sessionId,
    liveTranscript,
    error,
    lastAckSeq,
    start,
    pause,
    resume,
    stop,
  };
}
