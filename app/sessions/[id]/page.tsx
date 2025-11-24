// app/sessions/[id]/page.tsx
import Link from "next/link";
import { getSessionData } from "../../../lib/db";


type ChunkRow = {
id: string;
seq: number;
text: string | null;
filename: string | null;
created_at?: string | null;
createdAt?: string | null;
};


export default async function SessionDetailPage({ params }: { params: { id: string } }) {
let data: { session: any | null; chunks: ChunkRow[] } | null = null;


try {
data = await getSessionData(params.id);
} catch (err: any) {
// Show error in dev for easier debugging
return (
<div className="p-6">
<h1 className="text-xl font-bold text-red-600">Error loading session</h1>
<pre className="mt-4 p-4 bg-black/80 text-white rounded">{String(err?.message ?? err)}</pre>
<div className="mt-4">
<Link href="/sessions" className="text-blue-500 underline">Back to sessions</Link>
</div>
</div>
);
}


if (!data || !data.session) {
return (
<div className="p-6">
<h1 className="text-xl font-bold">Session not found</h1>
<p className="mt-2 text-sm text-slate-600">Make sure the session ID exists in the DB.</p>
<Link href="/sessions" className="text-blue-500 underline">Go back</Link>
</div>
);
}


const s: any = data.session;
const createdRaw = s.created_at ?? s.createdAt ?? s.createdat ?? null;


return (
<div className="p-6 max-w-3xl mx-auto">
<div className="flex justify-between items-center mb-6">
<h1 className="text-2xl font-bold">{s.title || "Untitled Session"}</h1>


<Link href="/sessions" className="px-4 py-2 rounded-lg border border-gray-400 hover:bg-gray-200 transition">Back</Link>
</div>


<div className="space-y-4">
<p><span className="font-semibold">Session ID:</span> {s.id}</p>
<p>
<span className="font-semibold">Status:</span>{' '}
<span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800">{s.status}</span>
</p>
</div>
</div>
)
}
