/**
 * Storage adapter — abstracts file I/O for local dev and Vercel deployments.
 *
 * Local dev / any server with a persistent filesystem (BLOB_READ_WRITE_TOKEN not set):
 *   Reads/writes files directly on the local filesystem under src/content/property/.
 *   No configuration needed — works out of the box.
 *
 * Vercel deployment (BLOB_READ_WRITE_TOKEN is set):
 *   Reads/writes to Vercel Blob (private, server-side only).
 *   On first read of any key, falls back to the bundled seed file if the blob
 *   doesn't exist yet (first-boot / fresh deploy scenario).
 *
 * All blobs are stored under the "property/" prefix namespace.
 * Keys are relative paths within src/content/property/ (e.g. "bookings.json",
 * "locales/en.json", ".auth-otp.json").
 *
 * ─── Blob operation caching ──────────────────────────────────────────────────
 * Vercel Blob "Advanced Requests" (list/put/del/head) are limited to 2,000/month
 * on the free tier. Without caching, each page load triggers 5–10 list() calls.
 *
 * Strategy:
 *   • Module-level URL cache: once we resolve a blob's download URL via list(),
 *     we store it in memory for the lifetime of the serverless instance. Subsequent
 *     reads from the same instance go straight to fetch() — zero Advanced Requests.
 *   • On write: the new download URL returned by put() is stored in the cache,
 *     so the next read also skips list().
 *   • On delete: the cache entry is evicted so the next read does a fresh list().
 *   • Stale URL guard: if fetch() returns 401/403/404 (URL rotated by Vercel),
 *     we evict the cache and retry once with a fresh list().
 */

import fs from "fs";
import path from "path";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const SEED_DIR = path.join(process.cwd(), "src", "content", "property");

// ─── Module-level URL cache ───────────────────────────────────────────────────
// Survives across multiple requests handled by the same serverless instance.
// Key: the blob key (e.g. "config.json"), Value: the download URL from Vercel Blob.
const downloadUrlCache = new Map<string, string>();

/** Evict a key from the URL cache (used after write or delete). */
export function evictBlobCache(key: string): void {
  downloadUrlCache.delete(key);
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Read a property content file.
 * key: relative path within src/content/property/ (e.g. "bookings.json", "locales/en.json")
 */
export async function readFile(key: string): Promise<string> {
  if (USE_BLOB) {
    const result = await readFromBlob(key);
    if (result !== null) return result;
  }
  // Filesystem: local dev or first-boot fallback (blob not written yet)
  return fs.readFileSync(path.join(SEED_DIR, key), "utf-8");
}

async function readFromBlob(key: string): Promise<string | null> {
  // 1. Try cached URL first (no Advanced Request)
  const cached = downloadUrlCache.get(key);
  if (cached) {
    const text = await fetchBlob(cached);
    if (text !== null) return text;
    // URL is stale — evict and fall through to list()
    downloadUrlCache.delete(key);
  }

  // 2. Cache miss (or stale): resolve the URL via list() (1 Advanced Request)
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: `property/${key}`, limit: 1 });
    if (blobs.length === 0) return null; // Not in Blob yet — seed from filesystem

    const url = blobs[0].downloadUrl;
    downloadUrlCache.set(key, url);
    return await fetchBlob(url);
  } catch {
    return null; // Any Blob error → fall back to filesystem seed
  }
}

/** Fetch a blob download URL. Returns null if the response is not OK. */
async function fetchBlob(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (res.ok) return res.text();
    // 401/403/404 means the URL has rotated — signal the caller to re-list
    return null;
  } catch {
    return null;
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Write a property content file.
 */
export async function writeFile(key: string, content: string): Promise<void> {
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`property/${key}`, content, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
      allowOverwrite: true,
    });
    // Update URL cache so next read skips list()
    downloadUrlCache.set(key, blob.downloadUrl);
    return;
  }
  // Filesystem: local dev
  const filePath = path.join(SEED_DIR, key);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a property content file (used for OTP cleanup).
 */
export async function deleteFile(key: string): Promise<void> {
  // Always evict from URL cache
  downloadUrlCache.delete(key);

  if (USE_BLOB) {
    try {
      const { list, del } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: `property/${key}`, limit: 1 });
      if (blobs.length > 0) await del(blobs[0].url);
    } catch {
      // Ignore deletion errors
    }
    return;
  }
  try {
    fs.unlinkSync(path.join(SEED_DIR, key));
  } catch {
    // Already gone — fine
  }
}
