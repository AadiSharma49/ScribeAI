## 🤖 ScribeAI — AI-Powered Meeting Scribing!
---
## ✨ Quick Summary

ScribeAI is a prototype real-time meeting scribing app built to demonstrate low-latency audio processing. It uses:

Next.js 14 (App Router + TypeScript) for frontend

Node.js + Socket.io for low-latency audio streaming

PostgreSQL (Supabase) for secure session storage

Audio is captured in 15–30s chunks, streamed to the server, saved, and later processed into transcripts and summaries by a background worker.

Note: Transcription uses safe stubs. Gemini/Whisper integration is implemented but disabled due to billing constraints.
---
## 🛠️ Tech Stack & Architecture
Component	Technology	Purpose
Frontend	Next.js 14, TypeScript	Routing, SSR/SSG, UI
Real-time	Node.js, Socket.io	Low-latency audio chunk streaming
Database	PostgreSQL (Supabase)	Session metadata & authentication
Background Jobs	Node.js Worker Thread	Offline transcription/summarization
AI/ML	Google Gemini (stubbed)	Future speech-to-text + diarization
Architecture Comparison
MediaRecorder + Socket (current)

Low latency

High reliability

Low–medium complexity

Ideal for rapid prototyping

Full WebRTC pipeline

Millisecond latency

Medium reliability (needs SFU)

High complexity

Ideal for real-time multi-user transcription

Batch upload

High latency (minutes)

Very reliable

Low complexity

Ideal for long recordings and cost control
---
## 🚀 How to Run Locally
```
1. Environment Setup (.env.local)
DATABASE_URL=postgresql://postgres:<DB_PASSWORD>@<HOST>:5432/postgres
DB_SSL=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
SOCKET_PORT=4000
JWT_SECRET=<long_random_secret>
GEMINI_API_KEY=
USE_WHISPER=false

2. Installation & Execution
npm install

# Socket.io server (4000)
npm run start:socket

# Next.js app (3000)
npm run dev
```
---
3. How to Test

Register & sign in (creates sa_session cookie)

Visit /sessions/record

Click Start → Stop

Check /sessions

Download transcript:
/api/sessions/<id>/download?format=txt

## 📂 Project Structure
app/
  sessions/record/page.tsx      – Recording UI
  sessions/page.tsx             – Session list
  sessions/[id]/page.tsx        – Session detail
  api/                          – Auth + download routes

components/RecorderUI.tsx       – Recorder UI wrapper
hooks/useRecorder.tsx           – Media capture + chunking logic

server/socketServer.js          – Handles audio chunk ingestion
server/worker/processSession.js – Background transcription worker

lib/db.ts                       – Postgres connection
lib/auth.server.ts              – JWT + cookie helpers
lib/gemini.ts                   – Gemini placeholder client
---

## ⚙️ Git Workflow
Initial Repo Setup
git init
git add .
git commit -m "chore: initial ScribeAI prototype"
git remote add origin <GITHUB_REMOTE_URL>
git branch -M main
git push -u origin main

Feature Branch Workflow
git checkout -b feat/gemini-integration
git add .
git commit -m "feat: add Gemini client (stubbed)"
git push -u origin feat/gemini-integration


Use clean commit messages:

feat(session): add worker

fix(auth): correct jwt expiration

###⚠️ Why Gemini Transcription Is Disabled

Enabling Gemini requires:

Google Cloud billing

API key with permissions

Quota adjustments

To avoid unexpected costs, the prototype keeps Gemini calls implemented but off.

How to enable later:

Enable Gemini Speech/Audio API

Enable billing

Create API key

Add GEMINI_API_KEY to .env.local

Configure lib/gemini.ts

Test accuracy & cost usage
---
## 📈 Long-Session Scalability

Long meetings risk memory pressure and network issues. ScribeAI reduces this by:

Using 15–30s chunk uploads

Keeping memory bounded on the client

Using IndexedDB for resumable uploads

Writing chunks directly to disk server-side

Running transcription in a background worker

For large-scale usage:

Use Redis + worker queues

Autoscale workers

Store audio in S3

Use WebRTC/SFU for ultra-low latency
