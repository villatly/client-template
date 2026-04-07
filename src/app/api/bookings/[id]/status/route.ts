/**
 * GET /api/bookings/[id]/status
 *
 * Lightweight polling endpoint used by /booking/success to detect when the
 * Stripe webhook has confirmed the booking.
 *
 * Returns only the fields the client needs for the polling loop — no sensitive data.
 */

import { NextResponse } from "next/server";
import { getBookingById } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = await getBookingById(id);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: booking.id,
    status: booking.status,
    // Return the reference code for both confirmed and payment_authorized —
    // the success page shows it in the authorized phase so the guest can track the booking.
    confirmationCode:
      booking.status === "confirmed" || booking.status === "payment_authorized"
        ? booking.confirmationCode
        : null,
  });
}
