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

// ─── Module-level content cache ───────────────────────────────────────────────
// Survives across requests handled by the same serverless instance.
// Combined with the URL cache in storage.ts this eliminates nearly all
// Vercel Blob Advanced Requests after the first load of each instance.
//
// TTL: 5 minutes — protects against stale content if an instance lives long.
// Admin writes call evictContent() to bust the cache immediately.
// Bookings and availability are NOT cached here (they must always be fresh).

const CACHE_TTL = 5 * 60 * 1000; // ms

interface CacheEntry<T> {
  value: T;
  expires: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expires > Date.now()) return entry.value;
  cache.delete(key);
  return undefined;
}

function setCached<T>(key: string, value: T): void {
  cache.set(key, { value, expires: Date.now() + CACHE_TTL });
}

function evictContent(key: string): void {
  cache.delete(key);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function readJSON<T>(key: string): Promise<T> {
  return JSON.parse(await readFile(key)) as T;
}

async function writeJSON(key: string, data: unknown): Promise<void> {
  await writeFile(key, JSON.stringify(data, null, 2));
}

// ─── Cached readers ───────────────────────────────────────────────────────────

export async function getConfig(): Promise<PropertyConfig> {
  const hit = getCached<PropertyConfig>("config");
  if (hit) return hit;
  const value = await readJSON<PropertyConfig>("config.json");
  setCached("config", value);
  return value;
}

export async function getBranding(): Promise<BrandingConfig> {
  const hit = getCached<BrandingConfig>("branding");
  if (hit) return hit;
  const value = await readJSON<BrandingConfig>("branding.json");
  setCached("branding", value);
  return value;
}

export async function getSections(): Promise<SectionVisibility> {
  const hit = getCached<SectionVisibility>("sections");
  if (hit) return hit;
  const value = await readJSON<SectionVisibility>("sections.json");
  setCached("sections", value);
  return value;
}

export async function getBooking(): Promise<BookingConfig> {
  const hit = getCached<BookingConfig>("booking");
  if (hit) return hit;
  const value = await readJSON<BookingConfig>("booking.json");
  setCached("booking", value);
  return value;
}

export async function getContent(locale?: string, config?: PropertyConfig): Promise<PropertyContent> {
  const cfg = config ?? await getConfig();
  const lang = locale ?? cfg.defaultLocale ?? "en";
  const cacheKey = `content-${lang}`;
  const hit = getCached<PropertyContent>(cacheKey);
  if (hit) return hit;
  let value: PropertyContent;
  try {
    value = await readJSON<PropertyContent>(`locales/${lang}.json`);
  } catch {
    value = await readJSON<PropertyContent>("locales/en.json");
  }
  setCached(cacheKey, value);
  return value;
}

// ─── Writers (invalidate cache on save) ───────────────────────────────────────

export async function writeContent(data: PropertyContent, locale = "en"): Promise<void> {
  await writeJSON(`locales/${locale}.json`, data);
  evictContent(`content-${locale}`);
}

export async function writeBranding(data: BrandingConfig): Promise<void> {
  await writeJSON("branding.json", data);
  evictContent("branding");
}

export async function writeSections(data: SectionVisibility): Promise<void> {
  await writeJSON("sections.json", data);
  evictContent("sections");
}

export async function writeConfig(data: PropertyConfig): Promise<void> {
  await writeJSON("config.json", data);
  evictContent("config");
}

export async function writeBooking(data: BookingConfig): Promise<void> {
  await writeJSON("booking.json", data);
  evictContent("booking");
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
