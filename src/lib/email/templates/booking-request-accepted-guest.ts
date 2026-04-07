/**
 * Email sent to the guest when the admin accepts their booking request (request_to_book mode).
 * Contains the Stripe payment link and a 24-hour deadline to complete payment.
 */

import type { Booking } from "@/lib/types";
import type { PropertyConfig, BrandingConfig } from "@/lib/types";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month:   "long",
    day:     "numeric",
    year:    "numeric",
  });
}

export function renderBookingRequestAcceptedGuest(
  booking:     Booking,
  checkoutUrl: string,
  config:      PropertyConfig,
  branding:    BrandingConfig,
): { subject: string; html: string; text: string } {
  const color = branding.primaryColor ?? "#1a1a1a";

  const subject = `Your booking request is accepted — complete payment to confirm`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:${color};padding:28px 32px;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;letter-spacing:0.05em;text-transform:uppercase;">${config.name}</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Great news — your request is accepted!</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 32px 0;">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${booking.guest.name},</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            We're delighted to confirm that your request for <strong>${booking.roomName}</strong> has been accepted. To secure your reservation, please complete payment using the link below.
          </p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
            The payment link is valid for <strong>30 minutes</strong>. If it expires, please contact us directly to arrange a new link.
          </p>
        </td></tr>

        <!-- Payment CTA -->
        <tr><td style="padding:0 32px 28px;text-align:center;">
          <a href="${checkoutUrl}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 40px;border-radius:8px;letter-spacing:0.01em;">
            Complete payment →
          </a>
          <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Secure payment powered by Stripe</p>
        </td></tr>

        <!-- Booking summary -->
        <tr><td style="padding:0 32px 32px;">
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Booking summary</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#374151;">
              <tr>
                <td style="padding:5px 0;color:#6b7280;width:110px;">Reference</td>
                <td style="padding:5px 0;font-family:monospace;font-weight:600;">${booking.confirmationCode}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#6b7280;">Room</td>
                <td style="padding:5px 0;font-weight:500;">${booking.roomName}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#6b7280;">Check-in</td>
                <td style="padding:5px 0;">${fmtDate(booking.checkIn)}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#6b7280;">Check-out</td>
                <td style="padding:5px 0;">${fmtDate(booking.checkOut)}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#6b7280;">Nights</td>
                <td style="padding:5px 0;">${booking.nights}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#6b7280;font-size:15px;">Amount due</td>
                <td style="padding:5px 0;font-weight:700;font-size:15px;color:#111827;">${booking.currency} ${booking.totalPrice.toLocaleString()}</td>
              </tr>
            </table>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 32px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
            ${config.name} · ${config.location}, ${config.country}<br>
            If the button above doesn't work, copy this link: ${checkoutUrl}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Great news — your request is accepted! — ${config.name}

Hi ${booking.guest.name},

Your request for ${booking.roomName} has been accepted. Please complete payment to secure your reservation:

${checkoutUrl}

The payment link is valid for 30 minutes.

Booking summary:
  Reference: ${booking.confirmationCode}
  Room:      ${booking.roomName}
  Check-in:  ${fmtDate(booking.checkIn)}
  Check-out: ${fmtDate(booking.checkOut)}
  Nights:    ${booking.nights}
  Amount:    ${booking.currency} ${booking.totalPrice.toLocaleString()}

${config.name} · ${config.location}, ${config.country}`;

  return { subject, html, text };
}
