/**
 * Storage adapter — abstracts file I/O for local dev and Vercel deployments.
 *
 * Local dev (SUPABASE_URL not set):
 *   Reads/writes files directly on the local filesystem under src/content/property/.
 *   No configuration needed — works out of the box.
 *
 * Production (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set):
 *   - Property data (JSON): stored in the `property_data` Supabase table.
 *   - Image uploads: stored in the `uploads` Supabase Storage public bucket.
 *   On first read of any key, falls back to the bundled seed file if the row
 *   doesn't exist yet (first-boot / fresh deploy scenario).
 *
 * Keys are the same short strings used throughout the app:
 *   "config", "branding", "sections", "booking",
 *   "content_en", "availability", "bookings", ".auth-otp"
 *
 * Image uploads use a separate path-based API (uploadImage / getPublicImageUrl).
 */

import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Environment detection ────────────────────────────────────────────────────

const USE_SUPABASE = !!(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SEED_DIR = path.join(process.cwd(), "src", "content", "property");

// ─── Supabase client (singleton, lazy) ───────────────────────────────────────

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  _client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return _client;
}

// ─── Key normalisation ────────────────────────────────────────────────────────
// The filesystem uses file paths like "config.json" and "locales/en.json".
// In Supabase we store flat keys like "config" and "content_en".

function toDbKey(fileKey: string): string {
  // locales/en.json → content_en
  const localeMatch = fileKey.match(/^locales\/(\w+)\.json$/);
  if (localeMatch) return `content_${localeMatch[1]}`;
  // config.json → config
  return fileKey.replace(/\.json$/, "").replace(/^\./, "");
}

function toSeedPath(fileKey: string): string {
  return path.join(SEED_DIR, fileKey);
}

/** No-op — kept for API compatibility in case it's imported elsewhere. */
export function evictBlobCache(_key: string): void {}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function readFile(key: string): Promise<string> {
  if (USE_SUPABASE) {
    const dbKey = toDbKey(key);

    // Supabase DB read (no in-process cache — ensures admin changes are
    // immediately visible on the public page across all Lambda instances)
    const { data, error } = await getClient()
      .from("property_data")
      .select("value")
      .eq("key", dbKey)
      .single();

    if (!error && data?.value !== undefined) {
      // Guard: if the `availability` row exists but holds `{}` (the empty
      // placeholder the setup script used to insert), fall through to the seed.
      // `{}` means "no rooms configured" which is indistinguishable from a
      // properly-seeded empty state, so we use the bundled seed instead.
      // Other keys (bookings = [], etc.) are left as-is — [] is valid there.
      const isEmptyAvailability = dbKey === "availability" && data.value.trim() === "{}";
      if (!isEmptyAvailability) {
        return data.value;
      }
    }

    // Fall back to seed file (first boot — row not yet inserted, or availability={})
    const seed = fs.readFileSync(toSeedPath(key), "utf-8");
    // Persist the seed to DB so future reads are fast
    await writeFile(key, seed);
    return seed;
  }

  // Local dev: filesystem
  return fs.readFileSync(toSeedPath(key), "utf-8");
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function writeFile(key: string, content: string): Promise<void> {
  if (USE_SUPABASE) {
    const dbKey = toDbKey(key);
    const { error } = await getClient()
      .from("property_data")
      .upsert(
        { key: dbKey, value: content, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (error) throw new Error(`Supabase write failed for "${dbKey}": ${error.message}`);
    return;
  }

  // Local dev: filesystem
  const filePath = toSeedPath(key);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteFile(key: string): Promise<void> {
  const dbKey = toDbKey(key);

  if (USE_SUPABASE) {
    await getClient().from("property_data").delete().eq("key", dbKey);
    return;
  }

  try {
    fs.unlinkSync(toSeedPath(key));
  } catch {
    // Already gone — fine
  }
}

// ─── Image uploads (Supabase Storage) ────────────────────────────────────────

const UPLOADS_BUCKET = "uploads";

/**
 * Upload an image buffer to Supabase Storage.
 * Returns the public URL of the uploaded file.
 *
 * In local dev (no Supabase), throws — images must be uploaded in production.
 */
export async function uploadImage(
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (!USE_SUPABASE) {
    throw new Error("Image upload requires Supabase (SUPABASE_URL not set).");
  }

  const { error } = await getClient()
    .storage
    .from(UPLOADS_BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);

  const { data } = getClient()
    .storage
    .from(UPLOADS_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}
