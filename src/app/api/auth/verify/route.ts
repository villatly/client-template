/**
 * POST /api/auth/verify
 *
 * Body: { code: string }
 *
 * Verifies the submitted OTP. On success, sets a signed session cookie and
 * returns { ok: true, redirect: "/admin" }.
 * On failure, returns an appropriate error message.
 */

import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/auth/otp";
import {
  createSessionToken,
  buildSetCookieHeader,
} from "@/lib/auth/session";

export async function POST(req: Request) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { code } = body;
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const result = await verifyOTP(code);

  const errorMessages: Record<string, string> = {
    invalid:      "Incorrect code. Please try again.",
    expired:      "This code has expired. Request a new one.",
    max_attempts: "Too many incorrect attempts. Request a new code.",
    not_found:    "No code found. Request a new one.",
  };

  if (result !== "valid") {
    return NextResponse.json(
      { error: errorMessages[result] ?? "Verification failed" },
      { status: 401 }
    );
  }

  // Issue a signed session cookie
  const token = await createSessionToken();
  const cookieHeader = buildSetCookieHeader(token);

  return NextResponse.json(
    { ok: true, redirect: "/admin" },
    {
      status: 200,
      headers: { "Set-Cookie": cookieHeader },
    }
  );
}
