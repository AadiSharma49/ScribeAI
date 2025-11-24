// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.server";

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ ok: false, user: null }, { status: 401 });
    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
