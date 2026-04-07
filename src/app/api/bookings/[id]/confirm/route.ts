/**
 * POST /api/bookings/[id]/confirm
 *
 * Admin/manual confirmation endpoint for bookings in "pending_confirmation" status.
 * Called by the admin dashboard for bookings that require manual review.
 *
 * What this endpoint does:
 *   1. Re-validates availability (final race-condition guard)
 *   2. Blocks the dates in availability.json
 *   3. Sets status → "confirmed"
 *
 * What this endpoint does NOT handle:
 *   - Bookings with confirmationMode "payment" (status: pending_payment)
 *     → Those can ONLY be confirmed by the Stripe webhook after a successful charge.
 *     → Attempting to confirm a payment booking via this endpoint returns 403.
 *
 * Returns 409 if the dates became unavailable between creation and now.
 */

import { NextResponse } from "next/server";
import { confirmBooking, getBookingById } from "@/lib/bookings";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const booking = await getBookingById(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Payment-mode bookings are confirmed exclusively via the Stripe webhook.
  // Allowing this endpoint to confirm them would bypass the payment requirement
  // and/or skip the Stripe capture step.
  if (booking.confirmationMode === "payment" || booking.confirmationMode === "request") {
    return NextResponse.json(
      {
        error:
          "This booking requires payment to be confirmed. " +
          "It will be confirmed automatically once payment has been processed. " +
          "If payment was completed but the booking is still pending, check the webhook logs.",
        code: "PAYMENT_REQUIRED",
      },
      { status: 403 }
    );
  }

  try {
    const confirmed = await confirmBooking(id);
    return NextResponse.json({
      id:               confirmed.id,
      confirmationCode: confirmed.confirmationCode,
      status:           confirmed.status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Confirmation failed";

    if (msg === "DATES_UNAVAILABLE") {
      return NextResponse.json(
        {
          error:
            "These dates were just taken by another booking. " +
            "Go back and select different dates.",
          code: "DATES_UNAVAILABLE",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
