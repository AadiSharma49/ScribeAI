// lib/audio.ts
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return await blob.arrayBuffer();
}

export function detectSupportedMime(): string {
  // prefer webm/opus if available
  const mimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const m of mimeTypes) {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) {
      return m;
    }
  }
  return "audio/webm";
}
