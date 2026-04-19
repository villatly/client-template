import type {
  PropertyConfig,
  BrandingConfig,
  SectionVisibility,
  PropertyContent,
  ResolvedProperty,
  BookingConfig,
  AvailabilityData,
} from "./types";
import { readFile, writeFile } from "./storage";

// Cache disabled — each request reads directly from Supabase so that
// admin changes are reflected immediately on the public page.
// (Module-level caches are per Lambda instance and cannot be invalidated
// cross-instance, causing stale data after admin saves.)

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function readJSON<T>(key: string): Promise<T> {
  return JSON.parse(await readFile(key)) as T;
}

async function writeJSON(key: string, data: unknown): Promise<void> {
  await writeFile(key, JSON.stringify(data, null, 2));
}

// ─── Cached readers ───────────────────────────────────────────────────────────

export async function getConfig(): Promise<PropertyConfig> {
  return readJSON<PropertyConfig>("config.json");
}

export async function getBranding(): Promise<BrandingConfig> {
  return readJSON<BrandingConfig>("branding.json");
}

export async function getSections(): Promise<SectionVisibility> {
  return readJSON<SectionVisibility>("sections.json");
}

export async function getBooking(): Promise<BookingConfig> {
  return readJSON<BookingConfig>("booking.json");
}

export async function getContent(locale?: string, config?: PropertyConfig): Promise<PropertyContent> {
  const cfg = config ?? await getConfig();
  const lang = locale ?? cfg.defaultLocale ?? "en";
  try {
    return await readJSON<PropertyContent>(`locales/${lang}.json`);
  } catch {
    return readJSON<PropertyContent>("locales/en.json");
  }
}

// ─── Writers (invalidate cache on save) ───────────────────────────────────────

export async function writeContent(data: PropertyContent, locale = "en"): Promise<void> {
  await writeJSON(`locales/${locale}.json`, data);
}

export async function writeBranding(data: BrandingConfig): Promise<void> {
  await writeJSON("branding.json", data);
}

export async function writeSections(data: SectionVisibility): Promise<void> {
  await writeJSON("sections.json", data);
}

export async function writeConfig(data: PropertyConfig): Promise<void> {
  await writeJSON("config.json", data);
}

export async function writeBooking(data: BookingConfig): Promise<void> {
  await writeJSON("booking.json", data);
}

// ─── Non-cached (must always be fresh) ───────────────────────────────────────

export async function getAvailability(): Promise<AvailabilityData> {
  try {
    return await readJSON<AvailabilityData>("availability.json");
  } catch {
    return {};
  }
}

export async function writeAvailability(data: AvailabilityData): Promise<void> {
  await writeJSON("availability.json", data);
}

// ─── Composite loader ─────────────────────────────────────────────────────────

export async function getProperty(locale?: string): Promise<ResolvedProperty> {
  const config = await getConfig();
  const [branding, sections, booking, content] = await Promise.all([
    getBranding(),
    getSections(),
    getBooking(),
    getContent(locale, config),
  ]);
  return { config, branding, sections, content, booking };
}
