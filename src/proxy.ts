/**
 * Next.js Proxy (formerly Middleware) — admin route protection.
 *
 * Runs before every request matching the configured paths.
 * All /admin/* pages and /api/admin/* routes require a valid session cookie.
 * Unauthenticated requests are redirected to /login (pages) or get a 401 (API).
 *
 * The session cookie is a HMAC-signed token verified with ADMIN_SESSION_SECRET.
 * See src/lib/auth/session.ts for the token format and verification logic.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  const isValid = token ? await verifySessionToken(token) : false;

  if (!isValid) {
    const { pathname } = request.nextUrl;

    // API routes: return 401 JSON (the frontend handles this gracefully)
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Admin pages: redirect to login, preserving the intended destination
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
