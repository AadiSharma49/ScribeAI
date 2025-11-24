// lib/auth.server.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { pool } from "./db"; // Postgres pool you already have

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change";
const COOKIE_NAME = "sa_session";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Password helpers
 */
export async function hashPassword(plain: string) {
  return bcrypt.hashSync(plain, 10);
}
export async function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compareSync(plain, hashed);
}

/**
 * JWT helpers
 */
export function signToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

/**
 * Cookie helpers that work with NextResponse (App Router)
 * and fall back to Node response setHeader (Pages Router) if needed.
 *
 * - If `res.cookies` exists (NextResponse), we use res.cookies.set()
 * - Otherwise we set Set-Cookie header directly (for compatibility)
 */
export function setSessionCookie(res: any, token: string) {
  // Next.js App Router NextResponse
  try {
    if (res?.cookies && typeof res.cookies.set === "function") {
      res.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: COOKIE_OPTS.httpOnly,
        path: COOKIE_OPTS.path,
        sameSite: COOKIE_OPTS.sameSite,
        secure: COOKIE_OPTS.secure,
        maxAge: COOKIE_OPTS.maxAge,
      });
      return;
    }
  } catch (e) {
    // continue to fallback
  }

  // fallback for pages/api (Node ServerResponse-like)
  if (res && typeof res.setHeader === "function") {
    const header = cookie.serialize(COOKIE_NAME, token, COOKIE_OPTS as any);
    res.setHeader("Set-Cookie", header);
    return;
  }

  // If none matched, try to set cookies property (best-effort)
  try {
    (res as any).cookies = (res as any).cookies || {};
    (res as any).cookies[COOKIE_NAME] = token;
  } catch {}
}

export function clearSessionCookie(res: any) {
  try {
    if (res?.cookies && typeof res.cookies.set === "function") {
      // set empty cookie with maxAge 0
      res.cookies.set({
        name: COOKIE_NAME,
        value: "",
        httpOnly: COOKIE_OPTS.httpOnly,
        path: COOKIE_OPTS.path,
        sameSite: COOKIE_OPTS.sameSite,
        secure: COOKIE_OPTS.secure,
        maxAge: 0,
      });
      return;
    }
  } catch (e) {}

  if (res && typeof res.setHeader === "function") {
    const header = cookie.serialize(COOKIE_NAME, "", { ...COOKIE_OPTS, maxAge: 0 } as any);
    res.setHeader("Set-Cookie", header);
    return;
  }

  try {
    (res as any).cookies = (res as any).cookies || {};
    (res as any).cookies[COOKIE_NAME] = "";
  } catch {}
}

/**
 * DB helpers
 */
export async function createUser({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name?: string;
}) {
  const hashed = await hashPassword(password);
  const result = await pool.query(
    `INSERT INTO "User"(email, password, name, created_at) VALUES ($1, $2, $3, now()) RETURNING id, email, name`,
    [email, hashed, name || null]
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string) {
  const r = await pool.query(`SELECT * FROM "User" WHERE email=$1 LIMIT 1`, [email]);
  return r.rows[0] ?? null;
}

/**
 * Get user from incoming Request-like object.
 *
 * Accepts either:
 * - a Request or Next.js Request where cookie header is accessible via req.headers.get('cookie'),
 * - OR an object with headers.cookie string (e.g. { headers: { cookie: '...' } }).
 */
export async function getUserFromRequest(req: any) {
  let cookieHeader = "";

  try {
    // If it's a Request (App Router), headers.get exists
    if (req && typeof req.headers?.get === "function") {
      cookieHeader = req.headers.get("cookie") || "";
    } else if (req && req.headers && typeof req.headers === "object") {
      // object with headers property that might be an object or string
      if (typeof req.headers.cookie === "string") cookieHeader = req.headers.cookie;
      else if (typeof req.headers === "string") cookieHeader = String(req.headers);
      else cookieHeader = "";
    } else if (typeof req === "string") {
      // if someone passed a cookie string directly
      cookieHeader = req;
    }
  } catch (e) {
    cookieHeader = "";
  }

  if (!cookieHeader) return null;

  const parsed = cookie.parse(cookieHeader || "");
  const token = parsed[COOKIE_NAME];
  if (!token) return null;

  const payload: any = verifyToken(token as string);
  if (!payload?.sub) return null;

  const r = await pool.query(`SELECT id, email, name, created_at FROM "User" WHERE id=$1 LIMIT 1`, [payload.sub]);
  return r.rows[0] ?? null;
}
