/**
 * POST /api/auth/request
 *
 * Generates a 6-digit OTP and emails it to the configured adminEmail.
 * No request body is required — there is only one admin and their email
 * is already set in config.json.
 *
 * Rate-limiting: generating a new OTP overwrites the previous one, so spamming
 * this endpoint only resets the countdown. Emails are fire-and-forget.
 *
 * In development (EMAIL_PROVIDER=dev), the OTP is also printed to the server
 * console so you don't need to open the preview file.
 */

import { NextResponse } from "next/server";
import { getConfig } from "@/lib/property";
import { generateOTP } from "@/lib/auth/otp";
import { sendAdminLoginOTPEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  // 5 OTP requests per 15-minute window per IP.
  // Prevents inbox flooding and Resend quota exhaustion.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`otp:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before requesting a new code." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }
  // OTP always goes to ADMIN_EMAIL (env var) — fixed at installation, never user-editable.
  // This is intentionally separate from config.adminEmail, which is the booking
  // notification email and is configurable from the admin panel.
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return NextResponse.json(
      { error: "Admin email is not configured" },
      { status: 503 }
    );
  }

  const config = await getConfig();

  const code = await generateOTP();

  // In development, print the code to the server console for easy access.
  // The email provider also writes an HTML preview to .email-previews/.
  if (process.env.NODE_ENV === "development") {
    console.log(
      `\n🔑 Admin OTP: ${code}\n` +
      `   Destination: ${adminEmail}\n` +
      `   Valid for 15 minutes.\n`
    );
  }

  // Best-effort email — don't block the response on delivery
  sendAdminLoginOTPEmail(adminEmail, code, config.name).catch((err) =>
    console.error("Failed to send OTP email:", err)
  );

  // Always return the same response regardless of whether the email was sent.
  // We don't confirm the email address exists, to avoid information leakage.
  return NextResponse.json({ ok: true }, { status: 200 });
}
