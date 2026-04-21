/**
 * POST /api/admin/bookings/[id]/refund — issue a Stripe refund from the admin panel.
 *
 * Body:
 *   { amount: number }  — amount in the booking's currency (e.g. 150000 for IDR 150,000)
 *                         Must be > 0 and ≤ booking.totalPrice.
 *
 * Requires:
 *   - Booking must have payment.status === "paid"
 *   - Booking must have payment.intentId (set by Stripe webhook)
 *   - Stripe keys must be configured
 *
 * On success: updates booking payment record and returns { booking, refundId }
 * On partial refund: payment.status stays "paid"; refundAmount + refundedAt are set
 * On full refund:    payment.status becomes "refunded"
 */

import { NextResponse } from "next/server";
import { getBookingById, recordRefund } from "@/lib/bookings";
import { validateStripeEnv, getStripe } from "@/lib/stripe";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const booking = await getBookingById(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.payment.status !== "paid") {
    return NextResponse.json(
      { error: "Can only refund bookings with a captured payment (status: paid)" },
      { status: 422 }
    );
  }

  if (!booking.payment.intentId) {
    return NextResponse.json(
      {
        error:
          "No Stripe PaymentIntent ID found on this booking. " +
          "Issue the refund manually from the Stripe Dashboard.",
      },
      { status: 422 }
    );
  }

  const refundAmount = body.amount;
  if (typeof refundAmount !== "number" || refundAmount <= 0 || !isFinite(refundAmount)) {
    return NextResponse.json({ error: "Invalid refund amount" }, { status: 400 });
  }

  if (refundAmount > booking.totalPrice) {
    return NextResponse.json(
      {
        error: `Refund amount (${booking.currency} ${refundAmount.toLocaleString()}) exceeds the booking total (${booking.currency} ${booking.totalPrice.toLocaleString()})`,
      },
      { status: 422 }
    );
  }

  try {
    validateStripeEnv();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe is not configured";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  try {
    const stripe = getStripe();
    const amountCents = Math.round(refundAmount * 100);

    const refund = await stripe.refunds.create({
      payment_intent: booking.payment.intentId,
      amount: amountCents,
    });

    const updated = await recordRefund(booking.id, refundAmount);

    return NextResponse.json({ booking: updated, refundId: refund.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Refund failed";
    console.error(`Refund failed for booking ${id}:`, err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
