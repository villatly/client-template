/**
 * Automatic iCal import sync endpoint.
 *
 * GET  /api/admin/ical/sync
 *   Called by Vercel Cron (or any external scheduler).
 *   Authenticated via the CRON_SECRET env var:
 *     Authorization: Bearer <CRON_SECRET>
 *   Always syncs all sources.
 *
 * POST /api/admin/ical/sync
 *   Manual trigger from the admin UI.
 *   Body (all optional — omit to sync everything):
 *     { roomId?: string, unitId?: string }
 *
 * For each unit that has icalSources configured:
 *   1. Fetch the external iCal URL
 *   2. Parse events into BlockedRange records
 *   3. Remove all existing blocks tagged with this icalSourceId
 *   4. Insert the fresh blocks
 *   5. Update lastSyncedAt + lastSyncStatus on the source record
 *
 * On completion writes the updated availability.json and returns a
 * per-source result summary.
 *
 * Also expires any stale pending_payment bookings older than 2 hours
 * as a safety net for missed Stripe webhook deliveries.
 */

import { NextResponse } from "next/server";
import { getAvailability, writeAvailability } from "@/lib/property";
import { fetchAndParseICal, icalEventsToBlockedRanges } from "@/lib/ical";
import { getBookings, expireBooking } from "@/lib/bookings";
import { sendBookingExpiredGuestEmail } from "@/lib/email";

interface SyncResult {
  roomId: string;
  unitId: string;
  sourceId: string;
  sourceLabel: string;
  status: "ok" | "error" | "empty_warning";
  eventsImported?: number;
  emptyWarning?: boolean;
  error?: string;
}

// ── Shared sync logic ────────────────────────────────────────────────────────

async function runSync(filter: { roomId?: string; unitId?: string }): Promise<Response> {
  const avail = await getAvailability();
  const now   = new Date().toISOString();
  const results: SyncResult[] = [];

  for (const [roomId, roomData] of Object.entries(avail)) {
    if (filter.roomId && roomId !== filter.roomId) continue;

    for (const unit of roomData.units) {
      if (filter.unitId && unit.id !== filter.unitId) continue;
      if (!unit.icalSources?.length) continue;

      for (const source of unit.icalSources) {
        try {
          const events    = await fetchAndParseICal(source.url);
          const newRanges = icalEventsToBlockedRanges(events, source.id);

          // Safety guard: if the feed came back empty but we had blocks before,
          // preserve the old blocks and mark as empty_warning instead of clearing.
          // A temporary outage or misconfigured feed should not open a booking window.
          const existingCount = unit.blockedRanges.filter(
            (r) => r.icalSourceId === source.id
          ).length;
          const isEmptyWarning = newRanges.length === 0 && existingCount > 0;

          if (isEmptyWarning) {
            source.lastSyncedAt   = now;
            source.lastSyncStatus = "empty_warning";
            source.lastSyncError  = `Feed returned 0 events but ${existingCount} block${existingCount !== 1 ? "s" : ""} were previously imported. Blocks preserved until feed returns data again.`;
          } else {
            unit.blockedRanges = [
              ...unit.blockedRanges.filter((r) => r.icalSourceId !== source.id),
              ...newRanges,
            ].sort((a, b) => a.from.localeCompare(b.from));
            source.lastSyncedAt   = now;
            source.lastSyncStatus = "ok";
            source.lastSyncError  = undefined;
          }

          results.push({
            roomId, unitId: unit.id,
            sourceId: source.id, sourceLabel: source.label,
            status: isEmptyWarning ? "empty_warning" : "ok",
            eventsImported: isEmptyWarning ? existingCount : events.length,
            emptyWarning: isEmptyWarning || undefined,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          source.lastSyncedAt   = now;
          source.lastSyncStatus = "error";
          source.lastSyncError  = message;

          results.push({
            roomId, unitId: unit.id,
            sourceId: source.id, sourceLabel: source.label,
            status: "error", error: message,
          });
        }
      }
    }
  }

  await writeAvailability(avail);

  // ── Expire stale pending_payment bookings ─────────────────────────────────
  // Safety net for cases where the Stripe checkout.session.expired webhook was
  // never delivered (network issue, misconfigured endpoint, etc.).
  // Any booking stuck in pending_payment for >2 hours is well past the 30-minute
  // Stripe session window and should be expired now, with the guest notified.
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const staleBookings = (await getBookings()).filter(
    (b) =>
      b.status === "pending_payment" &&
      Date.now() - new Date(b.createdAt).getTime() > TWO_HOURS_MS
  );

  const staleResults: Array<{
    bookingId: string;
    outcome: "expired" | "error";
    error?: string;
  }> = [];

  for (const booking of staleBookings) {
    try {
      const expired = await expireBooking(booking.id);
      sendBookingExpiredGuestEmail(expired).catch((err) =>
        console.error(`iCal sync: expiry email failed for stale booking ${booking.id}:`, err)
      );
      staleResults.push({ bookingId: booking.id, outcome: "expired" });
      console.log(
        `iCal sync: expired stale pending_payment booking ${booking.id} (created ${booking.createdAt})`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`iCal sync: failed to expire stale booking ${booking.id}:`, msg);
      staleResults.push({ bookingId: booking.id, outcome: "error", error: msg });
    }
  }

  return NextResponse.json({
    syncedAt: now,
    results,
    allOk: results.every((r) => r.status === "ok"),
    totalSources: results.length,
    staleExpired: staleResults,
  });
}

// ── GET — called by Vercel Cron every 2 hours ─────────────────────────────────

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return runSync({});
}

// ── POST — manual trigger from admin UI ───────────────────────────────────────

export async function POST(req: Request) {
  let body: { roomId?: string; unitId?: string } = {};
  try { body = await req.json(); } catch { /* empty body = sync all */ }
  return runSync(body);
}
