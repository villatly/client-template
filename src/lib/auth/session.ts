/**
 * Session cookie utilities — Edge runtime compatible.
 *
 * Uses globalThis.crypto.subtle (Web Crypto API) which is available in both
 * the Next.js Edge runtime (middleware) and Node.js 18+.
 *
 * Token format: {expiryTimestamp}:{hmac_hex}
 *   - expiryTimestamp: Date.now() + SESSION_DURATION_MS as a decimal string
 *   - hmac_hex: HMAC-SHA256(ADMIN_SESSION_SECRET, expiryTimestamp) as lowercase hex
 *
 * Verification: recompute HMAC, constant-time compare, check timestamp is in future.
 * Logout: clear the cookie — no server-side revocation needed for single-admin use.
 */

export const SESSION_COOKIE = "admin-session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return toHex(sig);
}

/** Constant-time string comparison to prevent timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Create a signed session token. Store it as the admin-session cookie value.
 * Requires ADMIN_SESSION_SECRET to be set.
 */
export async function createSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  const expiry = String(Date.now() + SESSION_DURATION_MS);
  const sig = await hmac(secret, expiry);
  return `${expiry}:${sig}`;
}

/**
 * Verify a session token from the cookie.
 * Returns true if the token is valid and not expired.
 */
export async function verifySessionToken(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const colonIdx = token.indexOf(":");
  if (colonIdx < 0) return false;

  const expiry = token.slice(0, colonIdx);
  const sig = token.slice(colonIdx + 1);

  const expiryMs = Number(expiry);
  if (!Number.isFinite(expiryMs) || Date.now() > expiryMs) return false;

  const expected = await hmac(secret, expiry);
  return safeEqual(expected, sig);
}

/**
 * Build a Set-Cookie header string for setting the session.
 * secure=true is set automatically when NEXT_PUBLIC_URL starts with https.
 */
export function buildSetCookieHeader(token: string): string {
  const isProduction =
    process.env.NEXT_PUBLIC_URL?.startsWith("https://") ?? false;
  const maxAge = Math.floor(SESSION_DURATION_MS / 1000);
  return [
    `${SESSION_COOKIE}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`,
    isProduction ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/** Build a Set-Cookie header string that clears the session. */
export function buildClearCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
