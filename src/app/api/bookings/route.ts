/**
 * POST /api/bookings — create a booking.
 *
 * Behavior depends on the configured booking mode:
 *
 *   instant_book:
 *     1. Validate → check availability → create booking (pending_payment)
 *     2. Create Stripe Checkout Session
 *     3. Return { id, checkoutUrl } — client redirects guest to Stripe
 *     Dates are blocked only after payment is confirmed via the Stripe webhook.
 *
 *   request_to_book:
 *     1. Validate → check availability → create booking (pending_review)
 *     2. Notify admin (email) + acknowledge guest (email)
 *     3. Return { id, type: "request" } — client shows "request submitted" screen
 *     Dates are NOT blocked until the admin accepts AND payment is completed.
 *     Admin accepts → booking moves to pending_payment + guest gets payment link.
 *     Admin declines → booking cancelled + guest notified.
 */

import { NextResponse } from "next/server";
import { getAvailability, getContent, getBooking } from "@/lib/property";
import { calculatePrice, findAvailableUnit } from "@/lib/pricing";
import { createBooking, attachStripeSession, expireBooking } from "@/lib/bookings";
import { validateStripeEnv, getStripe } from "@/lib/stripe";
import {
  sendBookingPendingPaymentEmail,
  sendBookingRequestAdminEmail,
  sendBookingRequestReceivedGuestEmail,
} from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  // ── Rate limiting ───────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`bookings:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  // ── Booking mode ────────────────────────────────────────────────────
  const bookingConfig = await getBooking();
  const isRequestMode = bookingConfig.mode === "request_to_book";

  // ── Stripe config check — only required for instant_book ────────────
  if (!isRequestMode) {
    try {
      validateStripeEnv();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Stripe is not configured";
      console.error(msg);
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "development"
              ? "Stripe is not configured. Check the server console for setup instructions."
              : "Booking payments are temporarily unavailable. Please contact the property.",
        },
        { status: 503 }
      );
    }
  }

  // ── Parse & validate input ──────────────────────────────────────────
  let body: {
    roomId?: string;
    checkIn?: string;
    checkOut?: string;
    guest?: {
      name?: string;
      email?: string;
      phone?: string;
      adults?: number;
      children?: number;
      notes?: string;
    };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { roomId, checkIn, checkOut, guest } = body;

  if (!roomId || !checkIn || !checkOut || checkIn >= checkOut) {
    return NextResponse.json({ error: "Invalid dates or room" }, { status: 400 });
  }

  const todayStr = new Date().toISOString().split("T")[0];
  if (checkIn < todayStr) {
    return NextResponse.json({ error: "Check-in date cannot be in the past" }, { status: 400 });
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRe.test(checkIn) || !dateRe.test(checkOut)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const MAX_STAY_NIGHTS = 90;
  const msPerDay = 24 * 60 * 60 * 1000;
  const requestedNights = Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / msPerDay
  );
  if (requestedNights > MAX_STAY_NIGHTS) {
    return NextResponse.json(
      { error: `Maximum stay is ${MAX_STAY_NIGHTS} nights. Please contact us directly for longer stays.` },
      { status: 400 }
    );
  }

  if (!guest?.name?.trim() || !guest?.email?.trim()) {
    return NextResponse.json({ error: "Guest name and email are required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // ── Server-side availability check ─────────────────────────────────
  const availability = await getAvailability();
  const roomData = availability[roomId];

  if (!roomData) {
    return NextResponse.json({ error: "Room not found in availability data" }, { status: 404 });
  }

  const availableUnit = findAvailableUnit(roomData.units, checkIn, checkOut);
  if (!availableUnit) {
    return NextResponse.json(
      { error: "Room is no longer available for the selected dates" },
      { status: 409 }
    );
  }

  const priceCalc = calculatePrice(roomData, checkIn, checkOut);
  if (priceCalc.totalNights < roomData.minStay) {
    return NextResponse.json(
      { error: `Minimum stay is ${roomData.minStay} nights` },
      { status: 400 }
    );
  }

  const content = await getContent();
  const room = content.rooms.find((r) => r.id === roomId);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // ── Capacity validation ─────────────────────────────────────────────
  const totalGuests = (guest?.adults ?? 1) + (guest?.children ?? 0);
  if (room.capacity && totalGuests > room.capacity) {
    return NextResponse.json(
      { error: `This room accommodates a maximum of ${room.capacity} guests` },
      { status: 400 }
    );
  }

  const currency = bookingConfig.currency || "USD";

  // ── Create booking record ───────────────────────────────────────────
  const booking = await createBooking({
    roomId,
    unitId: availableUnit.id,
    roomName: room.name,
    checkIn,
    checkOut,
    nights: priceCalc.totalNights,
    currency,
    priceBreakdown: priceCalc.breakdown,
    totalPrice: priceCalc.totalPrice,
    guest: {
      name: guest.name.trim(),
      email: guest.email.trim().toLowerCase(),
      phone: guest.phone?.trim() || undefined,
      adults: guest.adults ?? 1,
      children: guest.children ?? 0,
      notes: guest.notes?.trim() || undefined,
    },
    source: "direct",
    confirmationMode: isRequestMode ? "request" : "payment",
  });

  // ── Request to Book path ─────────────────────────────────────────────
  if (isRequestMode) {
    // Awaited so Vercel Lambda doesn't terminate before emails fire
    await Promise.allSettled([
      sendBookingRequestAdminEmail(booking),
      sendBookingRequestReceivedGuestEmail(booking),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          const label = i === 0 ? "admin request notification" : "guest request acknowledgment";
          console.error(`${label} email failed for booking ${booking.id}:`, r.reason);
        }
      });
    });
    return NextResponse.json({ id: booking.id, type: "request" }, { status: 201 });
  }

  // ── Instant Book path: create Stripe Checkout Session ───────────────
  try {
    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_URL!;

    const lineItems = priceCalc.breakdown.map((item) => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: `${room.name} — ${item.label}`,
          description: `${item.nights} night${item.nights !== 1 ? "s" : ""} × ${currency} ${item.pricePerNight.toLocaleString()}`,
          metadata: {
            roomId: booking.roomId,
            from: item.from,
            to: item.to,
          },
        },
        unit_amount: Math.round(item.pricePerNight * 100),
      },
      quantity: item.nights,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: booking.guest.email,
      metadata: {
        bookingId: booking.id,
        roomId: booking.roomId,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      },
      // Authorize first, capture after availability is confirmed in the webhook.
      // This eliminates the charge-now-refund-later race condition.
      payment_intent_data: { capture_method: "manual" },
      success_url: `${baseUrl}/booking/success?id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking/cancel?id=${booking.id}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    await attachStripeSession(booking.id, session.id);

    if (session.url) {
      await sendBookingPendingPaymentEmail(booking, session.url).catch((err) =>
        console.error("Pending payment email failed for booking", booking.id, err)
      );
    } else {
      console.warn(`Stripe session ${session.id} has no URL — pending payment email skipped for booking ${booking.id}`);
    }

    return NextResponse.json({ id: booking.id, checkoutUrl: session.url }, { status: 201 });
  } catch (err) {
    console.error("Stripe Checkout Session creation failed:", err);
    // Clean up the orphaned booking immediately. Without this it would sit in
    // pending_payment forever (the iCal sync would expire it after 2 hrs, but
    // that's unnecessary noise in the admin dashboard).
    expireBooking(booking.id).catch((expireErr) =>
      console.error(`Failed to expire orphaned booking ${booking.id} after Stripe session error:`, expireErr)
    );
    return NextResponse.json(
      { error: "Payment session could not be created. Please try again in a moment." },
      { status: 502 }
    );
  }
}
