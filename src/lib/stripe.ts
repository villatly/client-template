/**
 * Stripe client and environment validation.
 *
 * Design principles:
 *   - No fallback: Stripe is required. Missing config = loud error, not silent degradation.
 *   - Lazy init: the SDK loads only when a booking route actually needs it.
 *   - Singleton: one Stripe instance is reused across requests in the same server process.
 *   - Mode-aware: test vs live is inferred from the key prefix, not an extra env var.
 *
 * Usage:
 *   import { getStripe, validateStripeEnv } from "@/lib/stripe";
 *
 *   // At the top of any route that creates a Checkout Session:
 *   validateStripeEnv(); // throws with a clear message if anything is wrong
 *
 *   // Then use the client:
 *   const stripe = getStripe();
 */

import Stripe from "stripe";

// ─── API version ────────────────────────────────────────────────────────────
// Pin the API version. When Stripe releases a new version, update this
// intentionally and review the changelog — never let it drift silently.
const STRIPE_API_VERSION = "2026-03-25.dahlia" as const;

// ─── Environment validation ──────────────────────────────────────────────────

/**
 * Validate all required Stripe environment variables at request time.
 *
 * Throws a single error listing every problem found. The error message is
 * human-readable so it's immediately actionable from the dev server console.
 *
 * Call this at the top of every route that touches Stripe. It is a no-op
 * after the first successful validation (fast path via _validated flag).
 */
let _validated = false;

export function validateStripeEnv(): void {
  if (_validated) return; // already passed — skip repeated checks

  const errors: string[] = [];
  const isDev = process.env.NODE_ENV !== "production";

  // ── STRIPE_SECRET_KEY ────────────────────────────────────────────────
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    errors.push(
      "STRIPE_SECRET_KEY is not set.\n" +
        "   → Get it from: https://dashboard.stripe.com/test/apikeys"
    );
  } else if (secretKey.includes("REPLACE")) {
    errors.push(
      "STRIPE_SECRET_KEY is still a placeholder value.\n" +
        "   → Replace it with your real test key (sk_test_...) from the Stripe dashboard."
    );
  } else if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
    errors.push(
      `STRIPE_SECRET_KEY has an unexpected format (starts with: ${secretKey.slice(0, 12)}...).\n` +
        "   → Expected sk_test_... (test mode) or sk_live_... (production)."
    );
  } else if (isDev && secretKey.startsWith("sk_live_")) {
    errors.push(
      "STRIPE_SECRET_KEY is a LIVE key but NODE_ENV is not production.\n" +
        "   → Use a test key (sk_test_...) for local development to avoid real charges."
    );
  }

  // ── STRIPE_WEBHOOK_SECRET ────────────────────────────────────────────
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    errors.push(
      "STRIPE_WEBHOOK_SECRET is not set.\n" +
        "   → For local dev, run:  stripe listen --forward-to localhost:3000/api/webhooks/stripe\n" +
        "   → Copy the 'webhook signing secret' it prints, then set STRIPE_WEBHOOK_SECRET in .env.local."
    );
  } else if (webhookSecret.includes("REPLACE")) {
    errors.push(
      "STRIPE_WEBHOOK_SECRET is still a placeholder value.\n" +
        "   → Run the Stripe CLI listener and copy the whsec_... secret it prints."
    );
  } else if (!webhookSecret.startsWith("whsec_")) {
    errors.push(
      `STRIPE_WEBHOOK_SECRET has an unexpected format (starts with: ${webhookSecret.slice(0, 8)}...).\n` +
        "   → Expected whsec_... (from Stripe CLI or Stripe Dashboard > Webhooks)."
    );
  }

  // ── NEXT_PUBLIC_URL ──────────────────────────────────────────────────
  const publicUrl = process.env.NEXT_PUBLIC_URL;
  if (!publicUrl) {
    errors.push(
      "NEXT_PUBLIC_URL is not set.\n" +
        "   → Set it to http://localhost:3000 for local dev, or https://yourdomain.com in production."
    );
  } else if (!isDev && publicUrl.includes("localhost")) {
    errors.push(
      "NEXT_PUBLIC_URL points to localhost but NODE_ENV is production.\n" +
        "   → Set it to your real domain, e.g. https://yourdomain.com"
    );
  } else if (!isDev && publicUrl.startsWith("http://")) {
    errors.push(
      "NEXT_PUBLIC_URL uses http:// in production.\n" +
        "   → Must be https:// — Stripe will reject http redirect URLs in live mode."
    );
  }

  if (errors.length === 0) {
    _validated = true;
    return;
  }

  // Format a clear, readable error block
  const divider = "═".repeat(62);
  const lines = errors.map((e, i) => `  ${i + 1}. ${e}`).join("\n\n");
  const message =
    `\n╔${divider}╗\n` +
    `║  Stripe is not configured correctly${" ".repeat(27)}║\n` +
    `╟${divider}╢\n\n` +
    `${lines}\n\n` +
    `  Edit client-template/.env.local and restart the server.\n` +
    `  See .env.local.example for the full template.\n\n` +
    `╚${divider}╝\n`;

  throw new Error(message);
}

// ─── Stripe client ───────────────────────────────────────────────────────────

let _stripe: Stripe | null = null;

/**
 * Return the lazy-initialised Stripe client.
 * Always call validateStripeEnv() first in route handlers.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  // validateStripeEnv() must have already been called by the route handler.
  // We call it here too as a safety net, so getStripe() is always safe to call standalone.
  validateStripeEnv();
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  });
  return _stripe;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** "test" or "live" — inferred from the secret key prefix. */
export function getStripeMode(): "test" | "live" {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_live_") ? "live" : "test";
}
