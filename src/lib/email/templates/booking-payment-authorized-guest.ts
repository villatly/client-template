import type { Booking } from "@/lib/types";
import type { PropertyConfig, BrandingConfig } from "@/lib/types";
import { emailLayout, detailRow, sectionHeading, ctaButton, fmtDate } from "./base";

export function renderBookingPaymentAuthorizedGuest(
  booking: Booking,
  config: PropertyConfig,
  branding: BrandingConfig,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const subject = `Payment received — we're confirming your dates — ${config.name}`;
  const previewText = `Your payment is held. We'll confirm your stay at ${config.name} within 24 hours.`;

  const guestsLabel = [
    `${booking.guest.adults} adult${booking.guest.adults !== 1 ? "s" : ""}`,
    booking.guest.children > 0
      ? `${booking.guest.children} child${booking.guest.children !== 1 ? "ren" : ""}`
      : "",
  ].filter(Boolean).join(", ");

  const detailRows = [
    detailRow("Room",       booking.roomName),
    detailRow("Check-in",   fmtDate(booking.checkIn)),
    detailRow("Check-out",  fmtDate(booking.checkOut)),
    detailRow("Duration",   `${booking.nights} night${booking.nights !== 1 ? "s" : ""}`),
    detailRow("Guests",     guestsLabel),
    detailRow("Total",      `${booking.currency} ${booking.totalPrice.toLocaleString()}`),
  ].join("");

  const body = `
    <!-- Status badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#fffbeb;border:1.5px solid #fde68a;border-radius:50px;padding:8px 22px;">
        <span style="color:#92400e;font-weight:700;font-size:14px;">⏳ &nbsp;Payment Authorized — Pending Confirmation</span>
      </div>
    </div>

    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;text-align:center;">
      We've received your payment, ${booking.guest.name.split(" ")[0]}!
    </h2>
    <p style="margin:0 0 28px;font-size:15px;color:#57534e;line-height:1.6;text-align:center;">
      Your payment has been authorized and your requested dates are held.
      We sync our calendar with other booking platforms and will confirm your reservation within <strong>24 hours</strong>.
    </p>

    <!-- What happens next -->
    <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:10px;padding:20px 24px;margin:0 0 28px;">
      <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:#a8a29e;letter-spacing:1.5px;text-transform:uppercase;">What happens next</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#57534e;line-height:1.5;">
            <strong style="color:#1c1917;">✓ &nbsp;Right now:</strong> Your payment is authorized (held, not yet charged) and your dates are reserved.
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#57534e;line-height:1.5;">
            <strong style="color:#1c1917;">⏳ &nbsp;Within 24 hours:</strong> We verify your dates against all our booking platforms.
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#57534e;line-height:1.5;">
            <strong style="color:#1c1917;">✓ &nbsp;If available:</strong> Payment is captured, booking confirmed, and you get a confirmation email.
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#57534e;line-height:1.5;">
            <strong style="color:#1c1917;">✗ &nbsp;If unavailable:</strong> Your hold is immediately released — no charge is made — and we'll notify you.
          </td>
        </tr>
      </table>
    </div>

    <!-- Booking reference -->
    <div style="background:#1c1917;border-radius:10px;padding:20px 24px;text-align:center;margin:0 0 28px;">
      <p style="margin:0 0 4px;font-size:11px;color:#a8a29e;letter-spacing:2px;text-transform:uppercase;">Booking Reference</p>
      <p style="margin:0;font-size:30px;font-weight:700;color:#ffffff;font-family:'Courier New',Courier,monospace;letter-spacing:5px;">${booking.confirmationCode}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#78716c;">Keep this reference — you'll need it if you contact us.</p>
    </div>

    ${sectionHeading("Reservation details")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid #e7e5e4;border-radius:8px;padding:4px 20px;background:#fafaf9;">
      <tbody>${detailRows}</tbody>
    </table>

    ${ctaButton("View booking status →", `${baseUrl}/booking/confirm/${booking.id}`, branding.primaryColor)}

    <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.6;text-align:center;">
      Questions? Reply to this email or contact us at
      <a href="mailto:${config.adminEmail}" style="color:${branding.primaryColor};text-decoration:none;">${config.adminEmail}</a>
    </p>
  `;

  const html = emailLayout({
    propertyName: config.name,
    location:     config.location,
    adminEmail:   config.adminEmail,
    primaryColor: branding.primaryColor,
    previewText,
    body,
  });

  const text = [
    `Payment Received — Pending Confirmation — ${config.name}`,
    ``,
    `Hi ${booking.guest.name.split(" ")[0]},`,
    ``,
    `Your payment has been authorized and your requested dates are held.`,
    `We'll confirm your reservation within 24 hours after checking our calendar.`,
    ``,
    `BOOKING REFERENCE: ${booking.confirmationCode}`,
    ``,
    `WHAT HAPPENS NEXT`,
    `✓ Right now:        Your payment is authorized (held, not yet charged).`,
    `⏳ Within 24 hours: We verify your dates across all booking platforms.`,
    `✓ If available:     Payment captured, booking confirmed — confirmation email sent.`,
    `✗ If unavailable:   Hold released immediately, no charge made — we'll notify you.`,
    ``,
    `RESERVATION DETAILS`,
    `Room:      ${booking.roomName}`,
    `Check-in:  ${fmtDate(booking.checkIn)}`,
    `Check-out: ${fmtDate(booking.checkOut)}`,
    `Nights:    ${booking.nights}`,
    `Guests:    ${guestsLabel}`,
    `Total:     ${booking.currency} ${booking.totalPrice.toLocaleString()}`,
    ``,
    `View booking status: ${baseUrl}/booking/confirm/${booking.id}`,
    ``,
    `${config.name} · ${config.location}`,
    config.adminEmail,
  ].join("\n");

  return { subject, html, text };
}
