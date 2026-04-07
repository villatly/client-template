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
 */

import fs from "fs";
import path from "path";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const SEED_DIR = path.join(process.cwd(), "src", "content", "property");

/**
 * Read a property content file.
 * key: relative path within src/content/property/ (e.g. "bookings.json", "locales/en.json")
 */
export async function readFile(key: string): Promise<string> {
  if (USE_BLOB) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: `property/${key}`, limit: 1 });
      if (blobs.length > 0) {
        const res = await fetch(blobs[0].downloadUrl);
        if (res.ok) return res.text();
      }
    } catch {
      // Fall through to filesystem seed on any Blob error
    }
  }
  // Filesystem: local dev or first-boot fallback in Vercel (blob not written yet)
  return fs.readFileSync(path.join(SEED_DIR, key), "utf-8");
}

/**
 * Write a property content file.
 */
export async function writeFile(key: string, content: string): Promise<void> {
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    await put(`property/${key}`, content, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return;
  }
  // Filesystem: local dev
  const filePath = path.join(SEED_DIR, key);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

/**
 * Delete a property content file (used for OTP cleanup).
 */
export async function deleteFile(key: string): Promise<void> {
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
