/**
 * POST /api/webhooks/stripe
 *
 * Receives and processes Stripe webhook events. This is the authoritative path
 * for confirming bookings — no booking is ever confirmed without passing through here.
 *
 * ── Handled events ────────────────────────────────────────────────────────────
 *
 *   checkout.session.completed
 *     → Confirms the booking, blocks the dates, records payment details.
 *     → Triggers guest confirmation email + admin notification email.
 *
 *   checkout.session.expired
 *     → Expires the booking (dates were never blocked, nothing to unblock).
 *
 * ── Security ──────────────────────────────────────────────────────────────────
 *
 *   Every request is verified using the Stripe-Signature header against
 *   STRIPE_WEBHOOK_SECRET. The raw body is used — not parsed JSON.
 *   Requests with invalid signatures are rejected with 400.
 *
 * ── Idempotency ───────────────────────────────────────────────────────────────
 *
 *   Stripe may deliver the same event more than once (at-least-once delivery).
 *   Each handler performs an explicit status check before acting, so duplicate
 *   deliveries are detected and ignored without error.
 *
 * ── Error handling ────────────────────────────────────────────────────────────
 *
 *   We always return HTTP 200, even if our handler throws. Returning a non-200
 *   causes Stripe to retry the event — which is only appropriate for truly
 *   transient errors. For permanent failures (booking not found, invalid state),
 *   retrying would not help and would just generate noise.
 *
 *   CRITICAL errors (payment received but dates unavailable) are logged with
 *   full Stripe IDs so the admin can issue a manual refund via the dashboard.
 *
 * ── Local testing ─────────────────────────────────────────────────────────────
 *
 *   stripe listen --forward-to localhost:3000/api/webhooks/stripe
 *   stripe trigger checkout.session.completed
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  authorizeBooking,
  confirmAuthorizedBooking,
  expireBooking,
  rejectBooking,
  getBookingById,
} from "@/lib/bookings";
import {
  sendBookingConfirmedGuestEmail,
  sendBookingConfirmedAdminEmail,
  sendBookingRejectedGuestEmail,
  sendBookingExpiredGuestEmail,
  sendAmountMismatchAdminEmail,
  sendCaptureFailedAdminEmail,
} from "@/lib/email";

export async function POST(req: Request) {
  // ── Webhook secret guard ───────────────────────────────────────────────────
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret.includes("REPLACE")) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // ── Signature verification ─────────────────────────────────────────────────
  // Must use raw text body — parsed JSON changes the byte sequence and breaks the sig
  const rawBody = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    console.error("Stripe webhook: signature verification failed —", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // ── Event dispatch ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {

      // ── checkout.session.completed ──────────────────────────────────────────
      // Payment succeeded. Authorize → capture → confirm in one synchronous sequence.
      // Works for both instant_book and request_to_book (after admin acceptance).
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;

        if (!bookingId) {
          console.error("checkout.session.completed: bookingId missing from session metadata", {
            sessionId: session.id,
          });
          break;
        }

        const booking = await getBookingById(bookingId);
        if (!booking) {
          console.error(`checkout.session.completed: booking ${bookingId} not found in DB`, {
            sessionId: session.id,
          });
          break;
        }

        // ── Idempotency checks ────────────────────────────────────────────────
        // Stripe delivers webhooks at least once — duplicates are normal and must not
        // cause double-processing.
        if (booking.status === "confirmed") {
          console.log(`Stripe webhook [idempotent]: booking ${bookingId} already confirmed — skipping`);
          break;
        }
        if (booking.status === "payment_authorized") {
          // Capture+confirm is in flight — duplicate arrived mid-sequence. Safe to skip.
          console.log(`Stripe webhook [idempotent]: booking ${bookingId} already in payment_authorized — skipping`);
          break;
        }

        // ── Amount validation ─────────────────────────────────────────────────
        const stripeAmountCents = session.amount_total ?? 0;
        const expectedAmountCents = Math.round(booking.totalPrice * 100);
        if (stripeAmountCents !== expectedAmountCents) {
          console.warn(
            `Stripe amount mismatch for booking ${bookingId}: ` +
            `Stripe ${stripeAmountCents} cents, expected ${expectedAmountCents} cents. ` +
            `Proceeding — admin alert email sent for manual review.`
          );
          // Alert the admin — booking will still be confirmed, but the discrepancy
          // must be reviewed. Most likely cause is a server-side pricing bug.
          sendAmountMismatchAdminEmail(booking, stripeAmountCents, expectedAmountCents).catch(
            (err) => console.error(`Amount mismatch alert email failed for booking ${bookingId}:`, err)
          );
        }

        const intentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : undefined;

        // ── Authorize → capture → confirm (synchronous) ───────────────────────
        //
        // All steps run within this single webhook invocation.
        // The booking passes through payment_authorized as a transient state that
        // resolves to confirmed within the same request — guests polling /status
        // will see confirmed on their first poll.
        //
        // Step 1: Authorize (blocks dates tentatively, rechecks availability)
        let authorized;
        try {
          authorized = await authorizeBooking(bookingId, {
            status:    "authorized",
            method:    "stripe",
            sessionId: session.id,
            intentId,
            amount:    stripeAmountCents / 100,
            currency:  session.currency?.toUpperCase() ?? booking.currency,
          });
          console.log(`Booking ${bookingId}: authorized (PI: ${intentId ?? "n/a"})`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg === "DATES_UNAVAILABLE") {
            // Dates taken in the race window between session creation and webhook delivery.
            // Authorization hold is still uncaptured — void it immediately so the guest
            // is not charged. Reject the booking to reach a terminal state and notify the guest.
            console.error(
              `\n╔═══════════════════════════════════════════════════════╗\n` +
              `║  DATES_UNAVAILABLE on auth — hold voided, no charge   ║\n` +
              `╟───────────────────────────────────────────────────────╢\n` +
              `║  Booking ID  : ${bookingId}\n` +
              `║  Session     : ${session.id}\n` +
              `║  PI          : ${intentId ?? "n/a"}\n` +
              `║  Guest       : ${booking.guest.email}\n` +
              `║  Dates       : ${booking.checkIn} → ${booking.checkOut}\n` +
              `╚═══════════════════════════════════════════════════════╝\n`
            );
            if (intentId) {
              try {
                await getStripe().paymentIntents.cancel(intentId);
                console.log(`PI ${intentId} cancelled — no charge made`);
              } catch (cancelErr) {
                console.error(`Failed to void PI ${intentId}:`, cancelErr);
              }
            }
            // Reject the booking so it reaches a terminal state and the guest is notified.
            try {
              const rejected = await rejectBooking(
                bookingId,
                "Dates were taken by another booking just before payment could be confirmed"
              );
              sendBookingRejectedGuestEmail(rejected).catch((err) =>
                console.error(`Rejection email failed for booking ${bookingId}:`, err)
              );
            } catch (rejectErr) {
              console.error(`Failed to reject booking ${bookingId} after DATES_UNAVAILABLE:`, rejectErr);
            }
          } else {
            console.error(`Booking ${bookingId}: authorization failed in webhook:`, msg);
          }
          break;
        }

        // Step 2: Capture — dates confirmed available, charge the guest now
        // intentId must exist for card payments with capture_method: "manual".
        // If it's missing something is structurally wrong with the session — abort
        // rather than silently confirming without charging.
        if (!intentId) {
          console.error(
            `\n╔═══════════════════════════════════════════════════════╗\n` +
            `║  CRITICAL — no PaymentIntent on completed session    ║\n` +
            `╟───────────────────────────────────────────────────────╢\n` +
            `║  Booking ID  : ${bookingId}\n` +
            `║  Session     : ${session.id}\n` +
            `║  Guest       : ${booking.guest.email}\n` +
            `╟───────────────────────────────────────────────────────╢\n` +
            `║  Booking left in payment_authorized (dates blocked).  ║\n` +
            `║  Investigate session in Stripe dashboard.             ║\n` +
            `╚═══════════════════════════════════════════════════════╝\n`
          );
          break;
        }
        try {
          await getStripe().paymentIntents.capture(intentId);
          console.log(`Booking ${bookingId}: payment captured (PI: ${intentId})`);
        } catch (captureErr) {
            // Capture failed immediately after a successful authorization.
            // Extremely unlikely (would require card issuer to approve auth then decline capture).
            // The booking is left in payment_authorized with dates blocked. Admin must resolve
            // manually: either use the "Force confirm" action in the admin dashboard (if the
            // capture actually succeeded despite the error) or cancel the booking to void
            // the hold and free the dates.
            const captureErrMsg = captureErr instanceof Error ? captureErr.message : String(captureErr);
            console.error(
              `\n╔═══════════════════════════════════════════════════════╗\n` +
              `║  CAPTURE FAILED after successful authorization        ║\n` +
              `╟───────────────────────────────────────────────────────╢\n` +
              `║  Booking ID  : ${bookingId}\n` +
              `║  PI          : ${intentId}\n` +
              `║  Error       : ${captureErrMsg}\n` +
              `║  Guest       : ${booking.guest.email}\n` +
              `╟───────────────────────────────────────────────────────╢\n` +
              `║  Booking left in payment_authorized (dates blocked).  ║\n` +
              `║  Admin action required — check Stripe dashboard for   ║\n` +
              `║  capture status, then use Force Confirm or Cancel.    ║\n` +
              `╚═══════════════════════════════════════════════════════╝\n`
            );
            // Alert the admin by email so the issue is not only visible in logs.
            sendCaptureFailedAdminEmail(booking, intentId, captureErrMsg).catch((emailErr) =>
              console.error(`Failed to send capture failure alert email for booking ${bookingId}:`, emailErr)
            );
            break; // No guest confirmation — requires manual admin resolution
        }

        // Step 3: Confirm — record payment as captured, dates remain blocked
        let confirmed;
        try {
          confirmed = await confirmAuthorizedBooking(bookingId, {
            status: "paid",
            paidAt: new Date().toISOString(),
          });
          console.log(`Booking ${bookingId}: confirmed via Stripe webhook (PI: ${intentId ?? "n/a"})`);
        } catch (err) {
          // confirmAuthorizedBooking is a JSON write — failure here means money is
          // captured but booking status is still payment_authorized. Log as critical.
          // The next iCal sync will find payment_authorized, skip capture (PI already
          // captured, so capture will fail), and auto-reject — which would be wrong.
          // Admin must resolve manually: the booking needs to be marked confirmed.
          console.error(
            `\n╔═══════════════════════════════════════════════════════╗\n` +
            `║  CRITICAL — payment captured, confirm write failed    ║\n` +
            `╟───────────────────────────────────────────────────────╢\n` +
            `║  Booking ID  : ${bookingId}\n` +
            `║  PI captured : ${intentId ?? "n/a"}\n` +
            `║  Error       : ${err instanceof Error ? err.message : String(err)}\n` +
            `╟───────────────────────────────────────────────────────╢\n` +
            `║  ACTION: Mark booking confirmed in admin dashboard.   ║\n` +
            `╚═══════════════════════════════════════════════════════╝\n`
          );
          break;
        }

        // Step 4: Send confirmation emails (best-effort)
        const emailResults = await Promise.allSettled([
          sendBookingConfirmedGuestEmail(confirmed),
          sendBookingConfirmedAdminEmail(confirmed),
        ]);
        emailResults.forEach((r, i) => {
          if (r.status === "rejected") {
            const label = i === 0 ? "guest confirmation" : "admin notification";
            console.error(`Email send failed (${label}) for booking ${bookingId}:`, r.reason);
          }
        });

        break;
      }

      // ── checkout.session.expired ────────────────────────────────────────────
      // The guest did not complete payment within the session window (30 min).
      // Dates were never blocked, so no unblocking needed.
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;
        if (!bookingId) break;

        const booking = await getBookingById(bookingId);
        if (!booking) break;

        // ── Idempotency checks ────────────────────────────────────────────────
        // Cover all terminal / already-resolved states so we never attempt an
        // invalid transition and generate spurious error logs.
        if (booking.status === "expired") {
          console.log(`Stripe webhook [idempotent]: booking ${bookingId} already expired — skipping`);
          break;
        }
        if (booking.status === "confirmed") {
          // Edge case: payment completed and session-expired event both queued,
          // with expiry arriving after the completed event. Confirmed state wins.
          console.log(`Stripe webhook: booking ${bookingId} is confirmed — ignoring late expiry event`);
          break;
        }
        if (booking.status === "rejected" || booking.status === "cancelled") {
          // Booking was already rejected (DATES_UNAVAILABLE race) or cancelled by admin
          // before this expiry event arrived. Already in a terminal state — skip cleanly.
          console.log(`Stripe webhook: booking ${bookingId} is ${booking.status} — ignoring late expiry event`);
          break;
        }

        try {
          const expired = await expireBooking(bookingId);
          console.log(`Booking ${bookingId} expired via Stripe webhook`);
          // Notify the guest so they know their session timed out and no charge was made.
          sendBookingExpiredGuestEmail(expired).catch((err) =>
            console.error(`Expiry email failed for booking ${bookingId}:`, err)
          );
        } catch (err) {
          console.error(`Booking ${bookingId} expiry failed:`, err instanceof Error ? err.message : err);
        }
        break;
      }

      default:
        // Unknown event type — acknowledge without processing.
        // Add new case blocks above when subscribing to additional event types.
        console.log(`Stripe webhook: unhandled event type "${event.type}" (${event.id})`);
    }
  } catch (err) {
    // Outer catch: unexpected error in the switch block.
    // Still return 200 to prevent Stripe from retrying indefinitely.
    console.error("Stripe webhook: unexpected handler error:", err);
  }

  return NextResponse.json({ received: true });
}
