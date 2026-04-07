/**
 * Email sent to the guest immediately after they submit a booking request (request_to_book mode).
 * Confirms their request was received and sets expectation that the property will respond.
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

export function renderBookingRequestReceivedGuest(
  booking: Booking,
  config:  PropertyConfig,
  branding: BrandingConfig,
  baseUrl: string,
): { subject: string; html: string; text: string } {
  const color = branding.primaryColor ?? "#1a1a1a";
  const manageUrl = `${baseUrl}/booking/confirm/${booking.id}`;

  const subject = `Request received — ${booking.roomName} at ${config.name}`;

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
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Request Received</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 32px 0;">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${booking.guest.name},</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Thank you for your interest in <strong>${config.name}</strong>. We've received your booking request and will review it shortly.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            You'll receive a follow-up email once we confirm availability. If your request is accepted, we'll send you a secure payment link to complete your reservation. <strong>No payment has been taken at this stage.</strong>
          </p>
          <p style="margin:0 0 24px;">
            <a href="${manageUrl}" style="display:inline-block;background:${color};color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">View or cancel your request →</a>
          </p>
        </td></tr>

        <!-- Booking summary card -->
        <tr><td style="padding:0 32px 32px;">
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Your request summary</p>
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
                <td style="padding:5px 0;color:#6b7280;">Total</td>
                <td style="padding:5px 0;font-weight:600;">${booking.currency} ${booking.totalPrice.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#6b7280;">Guests</td>
                <td style="padding:5px 0;">${booking.guest.adults} adult${booking.guest.adults !== 1 ? "s" : ""}${booking.guest.children > 0 ? `, ${booking.guest.children} child${booking.guest.children !== 1 ? "ren" : ""}` : ""}</td>
              </tr>
            </table>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 32px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
            ${config.name} · ${config.location}, ${config.country}<br>
            If you have questions, reply to this email or contact us directly.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Request received — ${config.name}

Hi ${booking.guest.name},

Thank you for your interest in ${config.name}. We've received your booking request and will review it shortly.

You'll receive a follow-up email once we confirm availability. If your request is accepted, we'll send you a secure payment link. No payment has been taken at this stage.

View or cancel your request: ${manageUrl}

Your request summary:
  Reference: ${booking.confirmationCode}
  Room:      ${booking.roomName}
  Check-in:  ${fmtDate(booking.checkIn)}
  Check-out: ${fmtDate(booking.checkOut)}
  Nights:    ${booking.nights}
  Total:     ${booking.currency} ${booking.totalPrice.toLocaleString()}
  Guests:    ${booking.guest.adults} adult${booking.guest.adults !== 1 ? "s" : ""}${booking.guest.children > 0 ? `, ${booking.guest.children} child${booking.guest.children !== 1 ? "ren" : ""}` : ""}

${config.name} · ${config.location}, ${config.country}`;

  return { subject, html, text };
}
