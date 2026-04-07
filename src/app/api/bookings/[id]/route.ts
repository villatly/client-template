/**
 * GET /api/bookings/[id] — public booking lookup by UUID
 *
 * Used by the confirmation page to display booking details.
 * Returns a safe subset of the booking (no admin notes / internal fields).
 */

import { NextResponse } from "next/server";
import { getBookingById } from "@/lib/bookings";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = await getBookingById(id);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Return the public-safe fields only
  return NextResponse.json({
    id:               booking.id,
    confirmationCode: booking.confirmationCode,
    createdAt:        booking.createdAt,
    roomId:           booking.roomId,
    roomName:         booking.roomName,
    checkIn:          booking.checkIn,
    checkOut:         booking.checkOut,
    nights:           booking.nights,
    currency:         booking.currency,
    priceBreakdown:   booking.priceBreakdown,
    totalPrice:       booking.totalPrice,
    guest: {
      name:     booking.guest.name,
      adults:   booking.guest.adults,
      children: booking.guest.children,
    },
    status:           booking.status,
    confirmedAt:      booking.confirmedAt,
    cancelledAt:      booking.cancelledAt,
  });
}
