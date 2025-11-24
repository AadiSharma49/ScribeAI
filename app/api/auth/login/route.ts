// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  findUserByEmail,
  verifyPassword,
  signToken,
  setSessionCookie,
} from "@/lib/auth.server";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = BodySchema.parse(body);

    const user = await findUserByEmail(parsed.email);
    if (!user) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });

    const ok = await verifyPassword(parsed.password, user.password);
    if (!ok) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });

    const token = signToken({ sub: user.id, email: user.email });

    // create NextResponse and set cookie using helper that supports NextResponse
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });

    // set cookie on NextResponse (helper will call res.cookies.set)
    setSessionCookie(res, token);

    return res;
  } catch (err: any) {
    console.error("login route error:", err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 400 });
  }
}
