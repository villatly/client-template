/**
 * POST /api/auth/logout
 *
 * Clears the admin session cookie.
 * No authentication required — clearing a cookie you don't have is harmless.
 */

import { NextResponse } from "next/server";
import { buildClearCookieHeader } from "@/lib/auth/session";

export async function POST() {
  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { "Set-Cookie": buildClearCookieHeader() },
    }
  );
}
