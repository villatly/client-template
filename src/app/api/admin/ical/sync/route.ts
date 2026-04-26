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
import { getBookings, expireBooking, rejectBooking } from "@/lib/bookings";
import { isRangeBlocked } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";
import {
  sendBookingExpiredGuestEmail,
  sendBookingRejectedGuestEmail,
} from "@/lib/email";

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

  // ── Reject payment_authorized bookings that now conflict with iCal blocks ──
  //
  // A payment_authorized booking has money held on the guest's card and its
  // dates tentatively blocked. If a freshly-synced iCal feed now occupies the
  // same dates on the same unit, we must void the authorization hold and reject
  // the booking before the guest assumes everything is fine.
  //
  // We reload availability AFTER writing it so the conflict check sees the
  // current state including the blocks we just imported.
  const availAfterSync = await getAvailability();
  const authorizedBookings = (await getBookings()).filter(
    (b) => b.status === "payment_authorized"
  );

  const authorizedRejections: Array<{
    bookingId: string;
    outcome: "rejected" | "error";
    error?: string;
  }> = [];

  for (const b of authorizedBookings) {
    const roomData = availAfterSync[b.roomId];
    if (!roomData) continue;

    const unitIdx = b.unitId
      ? roomData.units.findIndex((u) => u.id === b.unitId)
      : 0;
    const unit = roomData.units[unitIdx >= 0 ? unitIdx : 0];
    if (!unit) continue;

    // Only test against iCal-sourced blocks — booking blocks from other confirmed
    // reservations are already caught at authorization time (authorizeBooking recheck).
    const icalBlocks = unit.blockedRanges.filter((r) => !!r.icalSourceId);
    if (!isRangeBlocked(b.checkIn, b.checkOut, icalBlocks)) continue;

    // Conflict detected — void the Stripe hold first so the guest is not charged.
    const intentId = b.payment.intentId;
    if (intentId) {
      try {
        await getStripe().paymentIntents.cancel(intentId);
        console.log(`iCal sync: voided PI ${intentId} for booking ${b.id} (iCal conflict)`);
      } catch (voidErr) {
        console.error(
          `iCal sync: failed to void PI ${intentId} for booking ${b.id}:`,
          voidErr
        );
        // Continue to reject the booking even if void fails — the hold will
        // expire naturally after 7 days and the admin log will have the PI ID.
      }
    }

    // Reject the booking and notify the guest.
    try {
      const rejected = await rejectBooking(
        b.id,
        "Your dates were booked on another platform just before your payment was processed"
      );
      await sendBookingRejectedGuestEmail(rejected).catch((emailErr) =>
        console.error(
          `iCal sync: rejection email failed for booking ${b.id}:`,
          emailErr
        )
      );
      authorizedRejections.push({ bookingId: b.id, outcome: "rejected" });
      console.log(
        `iCal sync: rejected payment_authorized booking ${b.id} — iCal conflict on unit ${unit.id}`
      );
    } catch (rejectErr) {
      const msg = rejectErr instanceof Error ? rejectErr.message : String(rejectErr);
      console.error(`iCal sync: failed to reject booking ${b.id}:`, msg);
      authorizedRejections.push({ bookingId: b.id, outcome: "error", error: msg });
    }
  }

  // ── Expire stale pending_payment bookings ─────────────────────────────────
  // Safety net for cases where the Stripe checkout.session.expired webhook was
  // never delivered (network issue, misconfigured endpoint, etc.).
  // Sessions are valid for 24 hours — expire anything stuck for >26 hours
  // (2h buffer) to avoid killing sessions that are still within their window.
  const TWENTY_SIX_HOURS_MS = 26 * 60 * 60 * 1000;
  const staleBookings = (await getBookings()).filter(
    (b) =>
      b.status === "pending_payment" &&
      Date.now() - new Date(b.createdAt).getTime() > TWENTY_SIX_HOURS_MS
  );

  const staleResults: Array<{
    bookingId: string;
    outcome: "expired" | "error";
    error?: string;
  }> = [];

  for (const booking of staleBookings) {
    try {
      const expired = await expireBooking(booking.id);
      await sendBookingExpiredGuestEmail(expired).catch((err) =>
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
    authorizedRejections,
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
