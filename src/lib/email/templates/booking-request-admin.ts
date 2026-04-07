/**
 * Email sent to the property admin when a new booking request arrives (request_to_book mode).
 * Contains full guest and booking details with a link to the admin bookings panel.
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

export function renderBookingRequestAdmin(
  booking: Booking,
  config:  PropertyConfig,
  branding: BrandingConfig,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const adminUrl = `${baseUrl}/admin/bookings`;
  const color    = branding.primaryColor ?? "#1a1a1a";

  const subject = `[Action Required] New booking request — ${booking.guest.name}, ${booking.roomName}`;

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
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">New Booking Request</h1>
        </td></tr>

        <!-- Alert -->
        <tr><td style="padding:24px 32px 0;">
          <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px 16px;">
            <p style="margin:0;font-size:14px;color:#713f12;font-weight:600;">Action required — accept or decline this request</p>
            <p style="margin:6px 0 0;font-size:13px;color:#854d0e;">
              The dates are NOT blocked until you accept. If you accept, the guest will receive a payment link via email.
            </p>
          </div>
        </td></tr>

        <!-- Booking details -->
        <tr><td style="padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:16px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Booking details</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#374151;">
                <tr>
                  <td style="padding:6px 0;color:#6b7280;width:130px;">Confirmation</td>
                  <td style="padding:6px 0;font-family:monospace;font-weight:600;">${booking.confirmationCode}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;">Room</td>
                  <td style="padding:6px 0;font-weight:500;">${booking.roomName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;">Check-in</td>
                  <td style="padding:6px 0;">${fmtDate(booking.checkIn)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;">Check-out</td>
                  <td style="padding:6px 0;">${fmtDate(booking.checkOut)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;">Nights</td>
                  <td style="padding:6px 0;">${booking.nights}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;">Total</td>
                  <td style="padding:6px 0;font-weight:600;">${booking.currency} ${booking.totalPrice.toLocaleString()}</td>
                </tr>
              </table>
            </td></tr>

            <tr><td style="border-top:1px solid #f3f4f6;padding-top:16px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Guest details</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#374151;">
                <tr>
                  <td style="padding:6px 0;color:#6b7280;width:130px;">Name</td>
                  <td style="padding:6px 0;font-weight:500;">${booking.guest.name}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;">Email</td>
                  <td style="padding:6px 0;"><a href="mailto:${booking.guest.email}" style="color:${color};">${booking.guest.email}</a></td>
                </tr>
                ${booking.guest.phone ? `<tr><td style="padding:6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;">${booking.guest.phone}</td></tr>` : ""}
                <tr>
                  <td style="padding:6px 0;color:#6b7280;">Guests</td>
                  <td style="padding:6px 0;">${booking.guest.adults} adult${booking.guest.adults !== 1 ? "s" : ""}${booking.guest.children > 0 ? `, ${booking.guest.children} child${booking.guest.children !== 1 ? "ren" : ""}` : ""}</td>
                </tr>
                ${booking.guest.notes ? `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Notes</td><td style="padding:6px 0;font-style:italic;color:#6b7280;">${booking.guest.notes}</td></tr>` : ""}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 32px 32px;">
          <a href="${adminUrl}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
            Review request in admin panel →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 32px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            ${config.name} · This notification was sent because you are the admin for this property.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `New booking request — ${config.name}

ACTION REQUIRED: Accept or decline this request in the admin panel.
${adminUrl}

Confirmation: ${booking.confirmationCode}
Room: ${booking.roomName}
Check-in:  ${fmtDate(booking.checkIn)}
Check-out: ${fmtDate(booking.checkOut)}
Nights:    ${booking.nights}
Total:     ${booking.currency} ${booking.totalPrice.toLocaleString()}

Guest: ${booking.guest.name}
Email: ${booking.guest.email}
${booking.guest.phone ? `Phone: ${booking.guest.phone}\n` : ""}Guests: ${booking.guest.adults} adult${booking.guest.adults !== 1 ? "s" : ""}${booking.guest.children > 0 ? `, ${booking.guest.children} child${booking.guest.children !== 1 ? "ren" : ""}` : ""}
${booking.guest.notes ? `Notes: ${booking.guest.notes}` : ""}`;

  return { subject, html, text };
}
