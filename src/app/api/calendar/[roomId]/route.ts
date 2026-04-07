/**
 * GET /api/calendar/[roomId]
 * GET /api/calendar/[roomId]?unit=room-1-u1
 *
 * PUBLIC iCal export endpoint. Returns a text/calendar feed of blocked dates
 * for the given room (or a specific unit within it).
 *
 * External platforms (Airbnb, Booking.com, VRBO, Google Calendar) subscribe
 * to this URL to automatically mark the same dates as unavailable on their side.
 *
 * No authentication required — the data exposed is only blocked date ranges,
 * never guest PII. The room ID acts as sufficient implicit access control
 * for a public accommodation website.
 *
 * Behaviour:
 *   - ?unit=room-1-u1  → exports only that specific unit's blocked dates
 *   - (no unit param)  → exports all units merged (union of blocked dates)
 *     This is the correct behaviour when the whole room is a single listing.
 */

import { NextResponse } from "next/server";
import { getAvailability, getContent, getConfig } from "@/lib/property";
import { generateICalFeed } from "@/lib/ical";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const unitFilter = searchParams.get("unit");

  const [avail, content, config] = await Promise.all([
    getAvailability(),
    getContent(),
    getConfig(),
  ]);

  const roomData = avail[roomId];
  if (!roomData) {
    return new NextResponse("Room not found", { status: 404 });
  }

  const room     = content.rooms.find((r) => r.id === roomId);
  const roomName = room?.name ?? roomId;

  const units = unitFilter
    ? roomData.units.filter((u) => u.id === unitFilter)
    : roomData.units;

  if (units.length === 0) {
    return new NextResponse("Unit not found", { status: 404 });
  }

  // Merge blocked ranges from all matching units.
  // For single-unit rooms this is just that unit's ranges.
  // For multi-unit rooms without a unit filter, we union all ranges so the
  // exported feed is conservative (blocks a date if ANY unit is taken).
  const allRanges = units.flatMap((u) => u.blockedRanges);
  const unitLabel = unitFilter ?? units[0].id;

  const icsBody = generateICalFeed({
    propertyName: config.name,
    roomName,
    unitId: unitLabel,
    blockedRanges: allRanges,
  });

  return new NextResponse(icsBody, {
    headers: {
      "Content-Type":        "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${roomId}.ics"`,
      // Allow caching for 1 hour — appropriate for manual / periodic sync
      "Cache-Control":       "public, max-age=3600, s-maxage=3600",
    },
  });
}
