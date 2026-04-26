/**
 * PATCH /api/admin/bookings/[id] — admin booking actions
 *
 * Supported actions (body.action):
 *   "accept"        — accept a pending_review request (request_to_book mode):
 *                     runs availability recheck → creates Stripe Checkout Session →
 *                     transitions to pending_payment → emails guest the payment link.
 *   "decline"       — decline a pending_review request: cancels booking + emails guest.
 *   "confirm"       — confirm a pending_confirmation booking (manual flow only).
 *   "force_confirm" — emergency recovery: mark a payment_authorized booking as confirmed
 *                     + paid WITHOUT capturing Stripe. Use only when Stripe confirms the
 *                     PI was already captured but our write failed. Sends confirmation emails.
 *   "cancel"        — cancel any cancellable booking (frees dates; voids Stripe hold if authorized).
 *   "complete"      — mark a confirmed booking as completed after check-out.
 *   "notes"         — update admin notes (no status change).
 */

import { NextResponse } from "next/server";
import {
  acceptBookingRequest,
  declineBookingRequest,
  confirmBooking,
  confirmAuthorizedBooking,
  cancelBooking,
  completeBooking,
  updateAdminNotes,
  getBookingById,
  attachStripeSession,
} from "@/lib/bookings";
import { getContent, getBooking, getAvailability } from "@/lib/property";
import { calculatePrice } from "@/lib/pricing";
import { validateStripeEnv, getStripe } from "@/lib/stripe";
import {
  sendBookingConfirmedGuestEmail,
  sendBookingConfirmedAdminEmail,
  sendBookingCancelledGuestEmail,
  sendBookingCancelledAdminEmail,
  sendBookingRequestAcceptedGuestEmail,
} from "@/lib/email";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { action?: string; reason?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!await getBookingById(id)) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  try {
    let updated: import("@/lib/types").Booking;
    switch (body.action) {

      // ── Accept (request_to_book) ──────────────────────────────────────────
      case "accept": {
        const bookingToAccept = (await getBookingById(id))!;
        if (bookingToAccept.status !== "pending_review") {
          return NextResponse.json(
            { error: "Can only accept bookings that are pending review" },
            { status: 422 }
          );
        }

        // Stripe is required for the payment step — check it before transitioning
        try {
          validateStripeEnv();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Stripe is not configured";
          console.error(msg);
          return NextResponse.json(
            { error: "Cannot accept — Stripe is not configured. Set up Stripe keys to enable payments." },
            { status: 503 }
          );
        }

        // Availability recheck + status transition (pending_review → pending_payment)
        try {
          updated = await acceptBookingRequest(id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg === "DATES_UNAVAILABLE") {
            return NextResponse.json(
              { error: "Cannot accept — these dates were taken by another booking." },
              { status: 409 }
            );
          }
          throw err;
        }

        // Create Stripe Checkout Session and email the payment link to the guest
        try {
          const stripe = getStripe();
          const baseUrl = process.env.NEXT_PUBLIC_URL!;
          const bookingConfig = await getBooking();
          const currency = bookingConfig.currency || "USD";

          const [content, availability] = await Promise.all([getContent(), getAvailability()]);
          const room = content.rooms.find((r) => r.id === updated.roomId);
          const roomAvail = availability[updated.roomId];

          if (!room || !roomAvail) {
            console.error(`Accept: room ${updated.roomId} not found in content/availability`);
            return NextResponse.json({ error: "Room data not found" }, { status: 500 });
          }

          const priceCalc = calculatePrice(roomAvail, updated.checkIn, updated.checkOut);

          const lineItems = priceCalc.breakdown.map((item) => ({
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `${room.name} — ${item.label}`,
                description: `${item.nights} night${item.nights !== 1 ? "s" : ""} × ${currency} ${item.pricePerNight.toLocaleString()}`,
                metadata: { roomId: updated.roomId, from: item.from, to: item.to },
              },
              unit_amount: Math.round(item.pricePerNight * 100),
            },
            quantity: item.nights,
          }));

          const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items: lineItems,
            customer_email: updated.guest.email,
            metadata: {
              bookingId: updated.id,
              roomId: updated.roomId,
              checkIn: updated.checkIn,
              checkOut: updated.checkOut,
            },
            payment_intent_data: { capture_method: "manual" },
            success_url: `${baseUrl}/booking/success?id=${updated.id}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/booking/cancel?id=${updated.id}`,
            expires_at: Math.floor(Date.now() / 1000) + 23 * 60 * 60,
          });

          updated = await attachStripeSession(updated.id, session.id);

          if (session.url) {
            await sendBookingRequestAcceptedGuestEmail(updated, session.url).catch((err) =>
              console.error(`Accept: payment link email failed for booking ${id}:`, err)
            );
          } else {
            console.warn(`Accept: Stripe session ${session.id} has no URL — payment link email skipped for booking ${id}`);
          }
        } catch (stripeErr) {
          console.error(`Accept: Stripe session creation failed for booking ${id}:`, stripeErr);
          // Booking is now pending_payment but has no session. Admin can retry or cancel.
          return NextResponse.json(
            {
              error: "Booking accepted but payment session could not be created. Please cancel and ask the guest to rebook, or contact support.",
              booking: updated,
            },
            { status: 502 }
          );
        }
        break;
      }

      // ── Decline (request_to_book) ─────────────────────────────────────────
      case "decline": {
        const bookingToDecline = (await getBookingById(id))!;
        if (bookingToDecline.status !== "pending_review") {
          return NextResponse.json(
            { error: "Can only decline bookings that are pending review" },
            { status: 422 }
          );
        }
        updated = await declineBookingRequest(id, body.reason || "Booking request declined by the property");
        // Notify guest + admin — awaited so Vercel Lambda doesn't terminate before emails fire
        await Promise.allSettled([
          sendBookingCancelledGuestEmail(updated),
          sendBookingCancelledAdminEmail(updated),
        ]).then((results) => {
          const labels = ["guest decline", "admin decline"];
          results.forEach((r, i) => {
            if (r.status === "rejected") {
              console.error(`${labels[i]} email failed for booking ${id}:`, r.reason);
            }
          });
        });
        break;
      }

      // ── Confirm (legacy manual flow) ──────────────────────────────────────
      case "confirm": {
        const bookingToConfirm = (await getBookingById(id))!;
        if (bookingToConfirm.status === "payment_authorized") {
          return NextResponse.json(
            {
              error:
                "Cannot confirm a payment_authorized booking via this action. " +
                "If the Stripe PI has already been captured, use force_confirm instead.",
              code: "USE_FORCE_CONFIRM",
            },
            { status: 422 }
          );
        }
        updated = await confirmBooking(id);
        break;
      }

      // ── Force confirm (recovery) ──────────────────────────────────────────
      case "force_confirm": {
        const bookingToForce = (await getBookingById(id))!;
        if (bookingToForce.status !== "payment_authorized") {
          return NextResponse.json(
            { error: "force_confirm is only valid for payment_authorized bookings" },
            { status: 422 }
          );
        }
        updated = await confirmAuthorizedBooking(id, {
          status: "paid",
          paidAt: new Date().toISOString(),
        });
        await Promise.allSettled([
          sendBookingConfirmedGuestEmail(updated),
          sendBookingConfirmedAdminEmail(updated),
        ]).then((emailResults) => {
          emailResults.forEach((r, i) => {
            if (r.status === "rejected") {
              const label = i === 0 ? "guest confirmation" : "admin notification";
              console.error(`force_confirm: ${label} email failed for booking ${id}:`, r.reason);
            }
          });
        });
        break;
      }

      // ── Cancel ──────────────────────────────────────────────────────────
      case "cancel": {
        const bookingToCancel = (await getBookingById(id))!;
        // Void Stripe hold if the booking is authorized (best-effort)
        if (
          bookingToCancel.status === "payment_authorized" &&
          bookingToCancel.payment.intentId
        ) {
          try {
            const stripe = getStripe();
            await stripe.paymentIntents.cancel(bookingToCancel.payment.intentId);
          } catch (stripeErr) {
            console.error(
              `Admin cancel: failed to void PI ${bookingToCancel.payment.intentId}:`,
              stripeErr
            );
          }
        }
        updated = await cancelBooking(id, body.reason);
        // Awaited so Vercel Lambda doesn't terminate before emails fire
        await Promise.allSettled([
          sendBookingCancelledGuestEmail(updated),
          sendBookingCancelledAdminEmail(updated),
        ]).then((results) => {
          const labels = ["guest cancellation", "admin cancellation"];
          results.forEach((r, i) => {
            if (r.status === "rejected") {
              console.error(`${labels[i]} email failed for booking ${id}:`, r.reason);
            }
          });
        });
        break;
      }

      case "complete":
        updated = await completeBooking(id);
        break;

      case "notes":
        updated = await updateAdminNotes(id, body.notes ?? "");
        break;

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ booking: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Action failed" },
      { status: 422 }
    );
  }
}
