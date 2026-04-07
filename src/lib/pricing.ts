/**
 * Pricing domain — pure calculation, no I/O.
 *
 * Responsibility: given a room's availability config and a date range, produce
 * a line-item cost breakdown that accounts for price periods (high season, etc.).
 *
 * This module is the single source of truth for price calculation. It is used by:
 *   - GET  /api/availability  (show prices in the search widget)
 *   - POST /api/bookings      (snapshot the price at booking creation time)
 *
 * V2 note: add promo-code / discount / tax logic here without touching consumers.
 */

import type { RoomAvailability, RoomUnitAvailability, BlockedRange, PriceLineItem } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nightCount(checkIn: string, checkOut: string): number {
  return Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
  );
}

/** Returns the date string N calendar days after `base` (UTC-safe). */
function addDays(base: string, n: number): string {
  const d = new Date(base + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split("T")[0];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface PriceCalculation {
  breakdown: PriceLineItem[];
  totalNights: number;
  totalPrice: number;
  /** Weighted average price per night, rounded. Useful for display. */
  avgPricePerNight: number;
}

/**
 * Calculate the price for a stay.
 *
 * The breakdown groups consecutive nights that share the same rate into a
 * single line item. This keeps receipts readable and makes it easy to explain
 * the total to a guest.
 *
 * Example: 5 nights where nights 3-5 fall in "High Season":
 *   [{ label: "Base Rate",    nights: 2, pricePerNight: 420, subtotal: 840  },
 *    { label: "High Season",  nights: 3, pricePerNight: 520, subtotal: 1560 }]
 *   totalPrice: 2400
 */
export function calculatePrice(
  roomData: RoomAvailability,
  checkIn: string,
  checkOut: string
): PriceCalculation {
  const totalNights = nightCount(checkIn, checkOut);

  if (totalNights <= 0) {
    return { breakdown: [], totalNights: 0, totalPrice: 0, avgPricePerNight: 0 };
  }

  const periods = roomData.pricePeriods ?? [];
  const breakdown: PriceLineItem[] = [];

  let i = 0;
  while (i < totalNights) {
    const nightDate = addDays(checkIn, i);

    // Find which period (if any) covers this night
    const periodIdx = periods.findIndex(
      (p) => nightDate >= p.from && nightDate <= p.to
    );
    const period = periodIdx >= 0 ? periods[periodIdx] : null;
    const pricePPN = period ? period.pricePerNight : roomData.pricePerNight;
    const label = period?.label ?? "Base Rate";

    // Extend this segment while the same period applies
    let j = i + 1;
    while (j < totalNights) {
      const nextDate = addDays(checkIn, j);
      const nextIdx = periods.findIndex(
        (p) => nextDate >= p.from && nextDate <= p.to
      );
      if (nextIdx !== periodIdx) break;
      j++;
    }

    const segmentNights = j - i;

    breakdown.push({
      label,
      from: addDays(checkIn, i),
      to: addDays(checkIn, j - 1),
      nights: segmentNights,
      pricePerNight: pricePPN,
      subtotal: pricePPN * segmentNights,
    });

    i = j;
  }

  const totalPrice = breakdown.reduce((s, item) => s + item.subtotal, 0);

  return {
    breakdown,
    totalNights,
    totalPrice,
    avgPricePerNight:
      totalNights > 0 ? Math.round(totalPrice / totalNights) : 0,
  };
}

/**
 * Check whether a date range overlaps any blocked range in the given list.
 * checkOut is the departure day (exclusive — the last blocked night is checkOut-1).
 */
export function isRangeBlocked(
  checkIn: string,
  checkOut: string,
  blockedRanges: BlockedRange[]
): boolean {
  return blockedRanges.some((r) => checkIn <= r.to && checkOut > r.from);
}

/**
 * Find the first unit of a room type that has the full range free.
 * Returns undefined if no unit is available for the requested dates.
 */
export function findAvailableUnit(
  units: RoomUnitAvailability[],
  checkIn: string,
  checkOut: string
): RoomUnitAvailability | undefined {
  return units.find((u) => !isRangeBlocked(checkIn, checkOut, u.blockedRanges));
}

/**
 * Count how many units of a room type are available for a given range.
 */
export function countAvailableUnits(
  units: RoomUnitAvailability[],
  checkIn: string,
  checkOut: string
): number {
  return units.filter((u) => !isRangeBlocked(checkIn, checkOut, u.blockedRanges)).length;
}
