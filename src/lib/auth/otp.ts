/**
 * One-time password (OTP) management — Node.js only (uses fs + crypto).
 * Do NOT import this from middleware (Edge runtime).
 *
 * Only one OTP exists at a time. Each new request overwrites the previous one.
 * The file is stored at src/content/property/.auth-otp.json (gitignored).
 *
 * Security properties:
 *   - 6-digit numeric code: 10^6 = 1,000,000 combinations
 *   - 15-minute expiry
 *   - Max 5 failed attempts — code is invalidated after that
 *   - New request always overwrites the previous code (rate limit: one active code)
 */

import { randomInt, timingSafeEqual } from "crypto";
import { readFile, writeFile, deleteFile } from "@/lib/storage";

const OTP_KEY = ".auth-otp.json";
const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

interface OTPRecord {
  code: string;
  expiresAt: string; // ISO timestamp
  attempts: number;
}

async function readOTP(): Promise<OTPRecord | null> {
  try {
    return JSON.parse(await readFile(OTP_KEY)) as OTPRecord;
  } catch {
    return null;
  }
}

async function writeOTP(record: OTPRecord): Promise<void> {
  await writeFile(OTP_KEY, JSON.stringify(record, null, 2));
}

/**
 * Generate and persist a new 6-digit OTP.
 * Overwrites any existing code.
 * Returns the code so the caller can include it in an email.
 */
export async function generateOTP(): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await writeOTP({
    code,
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    attempts: 0,
  });
  return code;
}

export type VerifyOTPResult =
  | "valid"
  | "invalid"      // Wrong code
  | "expired"      // Code is past its TTL
  | "max_attempts" // Too many wrong attempts
  | "not_found";   // No code exists (never requested, or already used)

/**
 * Verify a submitted OTP code.
 * Deletes the stored code on success.
 * Increments the attempt counter on failure.
 */
export async function verifyOTP(submitted: string): Promise<VerifyOTPResult> {
  const record = await readOTP();
  if (!record) return "not_found";

  // Expired
  if (new Date(record.expiresAt) < new Date()) {
    await deleteFile(OTP_KEY);
    return "expired";
  }

  // Too many attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    await deleteFile(OTP_KEY);
    return "max_attempts";
  }

  // Wrong code — constant-time compare to prevent timing attacks
  const expected = Buffer.from(record.code);
  const received = Buffer.from(submitted.trim().padEnd(record.code.length).slice(0, record.code.length));
  const match = submitted.trim().length === record.code.length && timingSafeEqual(expected, received);
  if (!match) {
    await writeOTP({ ...record, attempts: record.attempts + 1 });
    return "invalid";
  }

  // Valid — delete the code (single use)
  await deleteFile(OTP_KEY);
  return "valid";
}
