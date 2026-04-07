/**
 * POST /api/bookings/[id]/cancel — guest self-service cancellation
 *
 * The booking UUID acts as the implicit auth token (anyone who knows the UUID
 * can cancel — this is the standard approach for small property booking systems
 * and is acceptable because UUIDs are unguessable).
 *
 * Cancellable statuses: confirmed, pending_confirmation, pending_review
 * Not cancellable: pending_payment (let the Stripe session expire naturally),
 *                  and all terminal states.
 *
 * Request body: { reason?: string }
 */

import { NextResponse } from "next/server";
import { getBookingById, cancelBooking } from "@/lib/bookings";
import { sendBookingCancelledGuestEmail } from "@/lib/email";

const GUEST_CANCELLABLE: string[] = [
  "confirmed",
  "pending_confirmation",
  "pending_review",
];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const booking = await getBookingById(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!GUEST_CANCELLABLE.includes(booking.status)) {
    return NextResponse.json(
      {
        error: "This booking cannot be cancelled at this stage.",
        status: booking.status,
      },
      { status: 409 }
    );
  }

  let reason = "Cancelled by guest";
  try {
    const body = await req.json();
    if (typeof body.reason === "string" && body.reason.trim()) {
      reason = body.reason.trim();
    }
  } catch {
    // No body is fine
  }

  try {
    const cancelled = await cancelBooking(id, reason);

    // Best-effort notification email (don't fail the cancellation if email fails)
    Promise.allSettled([sendBookingCancelledGuestEmail(cancelled)]).catch(
      () => {}
    );

    return NextResponse.json({ ok: true, status: cancelled.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancellation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
