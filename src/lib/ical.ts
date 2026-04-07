/**
 * iCal (RFC 5545) utilities for blocked-date synchronisation.
 *
 * EXPORT — generate an iCal feed from our blocked ranges so external platforms
 *          (Airbnb, Booking.com) can subscribe and avoid double-bookings.
 *
 * IMPORT — fetch and parse an external iCal feed into BlockedRange records
 *          so our calendar shows what is already taken on other platforms.
 *
 * We use VALUE=DATE (all-day events) throughout — this is the format expected
 * by every major accommodation platform's calendar sync feature.
 *
 * DTEND semantics: in iCal, DTEND for an all-day event is EXCLUSIVE (the day
 * after the last occupied night). Our BlockedRange.to is INCLUSIVE (the last
 * occupied night). We convert on both sides.
 */

import type { BlockedRange } from "./types";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedICalEvent {
  dtStart: string;   // YYYY-MM-DD (first occupied night)
  dtEnd: string;     // YYYY-MM-DD (exclusive — day after last occupied night)
  summary?: string;
  uid?: string;
}

// ─── Export ────────────────────────────────────────────────────────────────────

/**
 * Generate an iCal feed (text/calendar) for a single room unit.
 * Each BlockedRange becomes one all-day VEVENT.
 */
export function generateICalFeed({
  propertyName,
  roomName,
  unitId,
  blockedRanges,
}: {
  propertyName: string;
  roomName: string;
  unitId: string;
  blockedRanges: BlockedRange[];
}): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const events = blockedRanges.map((r) => {
    // DTEND is the day AFTER the last occupied night (exclusive iCal convention)
    const dtStart = toICalDate(r.from);
    const dtEnd   = toICalDate(addDays(r.to, 1));

    const uid = r.bookingId
      ? `booking-${r.bookingId}@${slugify(propertyName)}`
      : r.icalEventId ?? `block-${r.from}-${r.to}-${unitId}@${slugify(propertyName)}`;

    const summary = r.icalSummary ?? (r.bookingId ? "Reserved" : "Not available");

    return crlf([
      "BEGIN:VEVENT",
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${esc(summary)}`,
      `UID:${uid}`,
      `DTSTAMP:${stamp}Z`,
      "END:VEVENT",
    ]);
  });

  return crlf([
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${esc(propertyName)}//Bookings//EN`,
    `X-WR-CALNAME:${esc(roomName)}`,
    "X-WR-CALDESC:Blocked dates — do not book these nights elsewhere",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ]);
}

// ─── Import ────────────────────────────────────────────────────────────────────

/** Parse iCal text into an array of date-range events. */
export function parseICal(icalText: string): ParsedICalEvent[] {
  // RFC 5545 line folding: CRLF + whitespace → unfold
  const text = icalText.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = text.split(/\r?\n/);

  const events: ParsedICalEvent[] = [];
  let inEvent = false;
  let cur: Partial<ParsedICalEvent> = {};

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line === "BEGIN:VEVENT") { inEvent = true; cur = {}; continue; }
    if (line === "END:VEVENT")   {
      inEvent = false;
      if (cur.dtStart && cur.dtEnd) events.push(cur as ParsedICalEvent);
      continue;
    }
    if (!inEvent) continue;

    const colon = line.indexOf(":");
    if (colon < 0) continue;

    // "DTSTART;VALUE=DATE" → propName="DTSTART"
    const propName = line.slice(0, colon).split(";")[0].toUpperCase();
    const value    = line.slice(colon + 1);

    switch (propName) {
      case "DTSTART": try { cur.dtStart = parseDate(value); } catch { /* skip unrecognised format */ } break;
      case "DTEND":   try { cur.dtEnd   = parseDate(value); } catch { /* skip unrecognised format */ } break;
      case "SUMMARY": cur.summary = unesc(value);      break;
      case "UID":     cur.uid     = value;              break;
    }
  }

  // Drop zero-length or backwards events
  return events.filter((e) => e.dtStart < e.dtEnd);
}

/**
 * Convert parsed iCal events into BlockedRange records for storage.
 * iCal DTEND is exclusive, so we subtract one day to get our inclusive .to.
 */
export function icalEventsToBlockedRanges(
  events: ParsedICalEvent[],
  icalSourceId: string
): BlockedRange[] {
  return events.map((e) => ({
    from:          e.dtStart,
    to:            addDays(e.dtEnd, -1), // exclusive → inclusive
    icalSourceId,
    icalEventId:   e.uid,
    icalSummary:   e.summary,
  }));
}

/**
 * Fetch an iCal URL (https:// or webcal://) and return parsed events.
 * Throws on network error, HTTP error, or missing VCALENDAR marker.
 */
/**
 * Block private/internal hostnames to prevent SSRF attacks.
 * An admin-configured iCal URL should only ever point to an external calendar service.
 */
function assertPublicUrl(urlStr: string): void {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("iCal URL must use http:// or https://");
  }

  const host = parsed.hostname.toLowerCase();
  const privatePatterns = [
    /^localhost$/,
    /^127\./,
    /^0\.0\.0\.0/,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,         // Link-local + AWS metadata endpoint
    /^::1$/,
    /^fc[0-9a-f]{2}:/,    // IPv6 unique local
    /^fe[89ab][0-9a-f]:/i, // IPv6 link-local
    /metadata\.google\.internal$/,
  ];
  if (privatePatterns.some((p) => p.test(host))) {
    throw new Error("iCal URL must point to an external host");
  }
}

export async function fetchAndParseICal(rawUrl: string): Promise<ParsedICalEvent[]> {
  // webcal:// is just https:// by convention
  const url = rawUrl.replace(/^webcal:\/\//i, "https://");

  assertPublicUrl(url);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "CalendarSync/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        throw new Error("Request timed out — the URL did not respond within 15 seconds");
      }
      throw new Error(`Could not reach the iCal URL: ${err.message}`);
    }
    throw err;
  }

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const text = await res.text();
  if (!text.includes("BEGIN:VCALENDAR")) {
    throw new Error("Response is not a valid iCal feed (missing BEGIN:VCALENDAR)");
  }

  return parseICal(text);
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

/** "YYYY-MM-DD" → "YYYYMMDD" */
function toICalDate(d: string): string {
  return d.replace(/-/g, "");
}

/** Parse any iCal date/datetime value → "YYYY-MM-DD" */
function parseDate(value: string): string {
  if (/^\d{8}$/.test(value))
    return `${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}`;
  if (/^\d{8}T/.test(value)) {
    const d = value.slice(0, 8);
    return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value))
    return value.slice(0, 10);
  throw new Error(`Unrecognised iCal date: "${value}"`);
}

/** Add (or subtract) days from a "YYYY-MM-DD" string. */
export function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── iCal text helpers ─────────────────────────────────────────────────────────

function crlf(parts: string[]): string {
  return parts.join("\r\n");
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g,  "\\;")
    .replace(/,/g,  "\\,")
    .replace(/\n/g, "\\n");
}

function unesc(s: string): string {
  return s
    .replace(/\\n/g,  "\n")
    .replace(/\\,/g,  ",")
    .replace(/\\;/g,  ";")
    .replace(/\\\\/g, "\\");
}
