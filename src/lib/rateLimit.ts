/**
 * In-memory rate limiter — no external dependencies required.
 *
 * Uses a sliding window counter keyed by IP address (or any string key).
 * Suitable for serverless environments: each function instance has its own
 * counter, so the effective limit is per-instance rather than globally
 * enforced. For a single-property site with low traffic this is intentional —
 * a warmed instance already has context, and cold instances start clean.
 *
 * Store is automatically pruned on each check to prevent unbounded growth.
 *
 * Usage:
 *   const result = checkRateLimit(ip, { limit: 5, windowMs: 15 * 60 * 1000 });
 *   if (!result.allowed) return 429;
 */

interface Entry {
  count: number;
  resetAt: number; // ms timestamp
}

const store = new Map<string, Entry>();

// Prune expired entries every N calls to keep memory bounded
let callsSincePrune = 0;
const PRUNE_INTERVAL = 200;

function prune() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets. Only set when allowed = false. */
  retryAfterSec: number;
}

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): RateLimitResult {
  callsSincePrune++;
  if (callsSincePrune >= PRUNE_INTERVAL) {
    prune();
    callsSincePrune = 0;
  }

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Extract the best available IP from a Next.js Request.
 * Falls back to "unknown" if no IP header is present (e.g. local dev).
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
