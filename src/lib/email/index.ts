/**
 * Email facade — the only import other modules need.
 *
 * Usage:
 *   import { sendBookingPendingPaymentEmail, sendBookingConfirmedGuestEmail, ... } from "@/lib/email";
 *
 * Provider selection (via EMAIL_PROVIDER env var):
 *   "dev"    — writes HTML files to .email-previews/ (default, zero config)
 *   "resend" — sends via Resend API (requires RESEND_API_KEY)
 *
 * All send functions:
 *   - are async (await them or use Promise.allSettled)
 *   - throw on failure — callers should wrap in try/catch if email is non-critical
 *   - read property config and branding directly from the filesystem (server-side only)
 *
 * Adding a new provider:
 *   1. Create src/lib/email/providers/{name}.ts implementing sendVia{Name}(EmailMessage)
 *   2. Add a case in the `send` function below
 *   3. Set EMAIL_PROVIDER={name} in your environment
 */

import { getConfig, getBranding } from "@/lib/property";
import type { Booking } from "@/lib/types";
import { renderBookingPendingPayment } from "./templates/booking-pending-payment";
import { renderBookingConfirmedGuest } from "./templates/booking-confirmed-guest";
import { renderBookingConfirmedAdmin } from "./templates/booking-confirmed-admin";
import { renderBookingPaymentAuthorizedGuest } from "./templates/booking-payment-authorized-guest";
import { renderBookingRejectedGuest } from "./templates/booking-rejected-guest";
import { renderBookingExpiredGuest } from "./templates/booking-expired-guest";
import { renderAdminLoginOTP } from "./templates/admin-login-otp";
import { renderBookingCancelledGuest } from "./templates/booking-cancelled-guest";
import { renderBookingAmountMismatchAdmin } from "./templates/booking-amount-mismatch-admin";
import { renderBookingRequestAdmin } from "./templates/booking-request-admin";
import { renderBookingRequestReceivedGuest } from "./templates/booking-request-received-guest";
import { renderBookingRequestAcceptedGuest } from "./templates/booking-request-accepted-guest";

// ─── Internal message shape ───────────────────────────────────────────────────

interface OutboundEmail {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

// ─── Provider dispatch ────────────────────────────────────────────────────────

async function send(message: OutboundEmail): Promise<void> {
  const provider = (process.env.EMAIL_PROVIDER ?? "dev").toLowerCase();
  const config = await getConfig();
  const from =
    process.env.EMAIL_FROM ??
    `${config.name} <noreply@example.com>`;

  const payload = { ...message, from };

  switch (provider) {
    case "resend": {
      const { sendViaResend } = await import("./providers/resend");
      await sendViaResend(payload);
      break;
    }

    case "dev":
    default: {
      const { sendViaDev } = await import("./providers/dev");
      await sendViaDev(payload);
      break;
    }
  }
}

// ─── Public email functions ───────────────────────────────────────────────────

/**
 * Sent to the admin when they request an OTP to log in.
 * The code is valid for 15 minutes and single-use.
 *
 * Call site: POST /api/auth/request
 */
export async function sendAdminLoginOTPEmail(
  adminEmail: string,
  code: string,
  propertyName: string
): Promise<void> {
  const { subject, html, text } = renderAdminLoginOTP(code, propertyName);
  await send({ to: adminEmail, subject, html, text });
}

/**
 * Sent to the guest immediately after the booking is created and the Stripe
 * Checkout Session is opened. Includes the checkout URL (valid for 30 min).
 *
 * Call site: POST /api/bookings (after session creation)
 */
export async function sendBookingPendingPaymentEmail(
  booking: Booking,
  checkoutUrl: string
): Promise<void> {
  const [config, branding] = await Promise.all([getConfig(), getBranding()]);
  const { subject, html, text } = renderBookingPendingPayment(
    booking,
    checkoutUrl,
    config,
    branding
  );
  await send({ to: booking.guest.email, subject, html, text });
}

/**
 * Sent to the guest when a conflict is detected during the Stripe webhook flow and
 * their booking cannot be honored. The Stripe authorization has already been voided.
 *
 * Call site: POST /api/webhooks/stripe (DATES_UNAVAILABLE race condition)
 */
export async function sendBookingRejectedGuestEmail(
  booking: Booking
): Promise<void> {
  const [config, branding] = await Promise.all([getConfig(), getBranding()]);
  const baseUrl  = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const { subject, html, text } = renderBookingRejectedGuest(
    booking,
    config,
    branding,
    baseUrl
  );
  await send({ to: booking.guest.email, subject, html, text });
}

/**
 * Sent to the guest when the Stripe Checkout Session expires (30-minute window
 * elapsed without completed payment). No charge was made; dates are released.
 *
 * Call site: POST /api/webhooks/stripe (checkout.session.expired)
 */
export async function sendBookingExpiredGuestEmail(
  booking: Booking
): Promise<void> {
  const [config, branding] = await Promise.all([getConfig(), getBranding()]);
  const baseUrl  = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const { subject, html, text } = renderBookingExpiredGuest(
    booking,
    config,
    branding,
    baseUrl
  );
  await send({ to: booking.guest.email, subject, html, text });
}

/**
 * Sent to the guest after their booking is confirmed via the Stripe webhook.
 * Contains the confirmation code, booking details, and a link to the confirmation page.
 *
 * Call site: POST /api/webhooks/stripe (checkout.session.completed)
 */
export async function sendBookingConfirmedGuestEmail(
  booking: Booking
): Promise<void> {
  const [config, branding] = await Promise.all([getConfig(), getBranding()]);
  const baseUrl  = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const { subject, html, text } = renderBookingConfirmedGuest(
    booking,
    config,
    branding,
    baseUrl
  );
  await send({ to: booking.guest.email, subject, html, text });
}

/**
 * Sent to the property admin after a booking is confirmed.
 * Contains full guest info, booking details, and payment identifiers for reference.
 *
 * Call site: POST /api/webhooks/stripe (checkout.session.completed)
 */
export async function sendBookingConfirmedAdminEmail(
  booking: Booking
): Promise<void> {
  const config = await getConfig();
  if (!config.adminEmail) {
    console.warn("Email: adminEmail not set in config.json — skipping admin notification");
    return;
  }
  const branding = await getBranding();
  const baseUrl  = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const { subject, html, text } = renderBookingConfirmedAdmin(
    booking,
    config,
    branding,
    baseUrl
  );
  await send({ to: config.adminEmail, subject, html, text });
}

/**
 * Sent to the guest when an admin cancels their booking.
 * Includes a refund notice if the booking was paid (directing them to contact the property).
 *
 * Call site: PATCH /api/admin/bookings/[id] (action: "cancel")
 */
export async function sendBookingCancelledGuestEmail(
  booking: Booking
): Promise<void> {
  const [config, branding] = await Promise.all([getConfig(), getBranding()]);
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const { subject, html, text } = renderBookingCancelledGuest(
    booking,
    config,
    branding,
    baseUrl
  );
  await send({ to: booking.guest.email, subject, html, text });
}

/**
 * Sent to the property admin when a new booking request arrives (request_to_book mode).
 * Contains full guest and booking details with a link to the admin bookings panel.
 *
 * Call site: POST /api/bookings (request_to_book mode)
 */
export async function sendBookingRequestAdminEmail(
  booking: Booking
): Promise<void> {
  const config = await getConfig();
  if (!config.adminEmail) {
    console.warn("Email: adminEmail not set in config.json — skipping admin request notification");
    return;
  }
  const branding = await getBranding();
  const baseUrl  = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const { subject, html, text } = renderBookingRequestAdmin(booking, config, branding, baseUrl);
  await send({ to: config.adminEmail, subject, html, text });
}

/**
 * Sent to the guest immediately after they submit a booking request (request_to_book mode).
 * Confirms receipt and sets expectation that the property will respond.
 *
 * Call site: POST /api/bookings (request_to_book mode)
 */
export async function sendBookingRequestReceivedGuestEmail(
  booking: Booking
): Promise<void> {
  const [config, branding] = await Promise.all([getConfig(), getBranding()]);
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const { subject, html, text } = renderBookingRequestReceivedGuest(booking, config, branding, baseUrl);
  await send({ to: booking.guest.email, subject, html, text });
}

/**
 * Sent to the guest when the admin accepts their booking request.
 * Contains the Stripe payment link to complete the reservation.
 *
 * Call site: PATCH /api/admin/bookings/[id] (action: "accept")
 */
export async function sendBookingRequestAcceptedGuestEmail(
  booking: Booking,
  checkoutUrl: string
): Promise<void> {
  const [config, branding] = await Promise.all([getConfig(), getBranding()]);
  const { subject, html, text } = renderBookingRequestAcceptedGuest(booking, checkoutUrl, config, branding);
  await send({ to: booking.guest.email, subject, html, text });
}

/**
 * Sent to the admin when Stripe's reported amount doesn't match the booking total.
 * The booking is already confirmed — this is an alert for manual review.
 *
 * Call site: POST /api/webhooks/stripe (checkout.session.completed, amount check)
 */
export async function sendAmountMismatchAdminEmail(
  booking: Booking,
  stripeAmountCents: number,
  expectedAmountCents: number
): Promise<void> {
  const config = await getConfig();
  if (!config.adminEmail) return;
  const branding = await getBranding();
  const baseUrl  = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const { subject, html, text } = renderBookingAmountMismatchAdmin(
    booking,
    stripeAmountCents,
    expectedAmountCents,
    config,
    branding,
    baseUrl
  );
  await send({ to: config.adminEmail, subject, html, text });
}
