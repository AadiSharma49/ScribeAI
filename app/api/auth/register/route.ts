// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail, createUser, signToken, setSessionCookie } from "@/lib/auth.server";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = BodySchema.parse(body);

    const existing = await findUserByEmail(parsed.email);
    if (existing) return NextResponse.json({ ok: false, error: "Email already registered" }, { status: 400 });

    const user = await createUser({ email: parsed.email, password: parsed.password, name: parsed.name });

    const token = signToken({ sub: user.id, email: user.email });
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    setSessionCookie(res, token);
    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 400 });
  }
}
