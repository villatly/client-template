import { NextResponse } from "next/server";
import { writeFile } from "@/lib/storage";
import fs from "fs";
import path from "path";

const SEED_DIR = path.join(process.cwd(), "src", "content", "property");

const SEED_KEYS = [
  "config.json",
  "branding.json",
  "booking.json",
  "sections.json",
  "locales/en.json",
  "availability.json",
];

/**
 * POST /api/admin/reseed
 * Force-writes all seed JSON files to Supabase, overwriting any existing data.
 * Use this after deploying new content to main to sync it to the live database.
 */
export async function POST() {
  const results: Record<string, string> = {};

  for (const key of SEED_KEYS) {
    const filePath = path.join(SEED_DIR, key);
    if (!fs.existsSync(filePath)) {
      results[key] = "skipped (file not found)";
      continue;
    }
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      await writeFile(key, content);
      results[key] = "ok";
    } catch (err) {
      results[key] = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return NextResponse.json({ reseeded: results });
}
