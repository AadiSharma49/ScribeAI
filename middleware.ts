// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import cookie from "cookie";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change";
const PUBLIC = ["/", "/login", "/register", "/api/auth", "/api/auth/login", "/api/auth/register", "/_next", "/favicon.ico"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();

  if (pathname.startsWith("/sessions")) {
    const cookieHeader = req.headers.get("cookie") || "";
    const parsed = cookie.parse(cookieHeader || "");
    const token = parsed["sa_session"];
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      jwt.verify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (e) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/sessions/:path*"] };
