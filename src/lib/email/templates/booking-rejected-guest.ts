import type { Booking } from "@/lib/types";
import type { PropertyConfig, BrandingConfig } from "@/lib/types";
import { emailLayout, detailRow, sectionHeading, fmtDate } from "./base";

// Distinguish the two rejection reasons so email copy is accurate.
function isExpiryRejection(reason?: string): boolean {
  return !!reason?.toLowerCase().includes("expired");
}

export function renderBookingRejectedGuest(
  booking: Booking,
  config: PropertyConfig,
  branding: BrandingConfig,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const isExpiry = isExpiryRejection(booking.cancellationReason);
  const subject = isExpiry
    ? `We're sorry — your booking authorization expired — ${config.name}`
    : `We're sorry — your dates are no longer available — ${config.name}`;
  const previewText = `Unfortunately your booking for ${booking.checkIn} could not be confirmed. No charge was made.`;

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
    detailRow("Total",      `${booking.currency} ${booking.totalPrice.toLocaleString()} — NOT CHARGED`),
  ].join("");

  // CTA button without importing ctaButton (using manual inline so we can use outline style)
  const ctaOutline = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr>
      <td>
        <a href="${baseUrl}" target="_blank"
          style="display:inline-block;background:#ffffff;color:#1c1917;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:6px;letter-spacing:0.2px;border:1.5px solid #e7e5e4;">
          Search available dates →
        </a>
      </td>
    </tr>
  </table>`;

  const body = `
    <!-- Status badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#fef2f2;border:1.5px solid #fecaca;border-radius:50px;padding:8px 22px;">
        <span style="color:#991b1b;font-weight:700;font-size:14px;">✗ &nbsp;Booking Unavailable — No Charge Made</span>
      </div>
    </div>

    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;text-align:center;">
      We're sorry, ${booking.guest.name.split(" ")[0]}
    </h2>
    <p style="margin:0 0 28px;font-size:15px;color:#57534e;line-height:1.6;text-align:center;">
      ${isExpiry
        ? `Unfortunately, we were unable to confirm your booking in time. The payment authorization hold expired (Stripe holds are valid for 7 days) before we could process your reservation.`
        : `Unfortunately, your requested dates are no longer available — they were booked on another platform just before we could confirm your reservation.`
      }
    </p>

    <!-- No charge notice -->
    <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:18px 24px;margin:0 0 28px;text-align:center;">
      <p style="margin:0;font-size:15px;font-weight:700;color:#15803d;">✓ &nbsp;Your card has NOT been charged</p>
      <p style="margin:6px 0 0;font-size:13px;color:#166534;line-height:1.5;">
        The payment authorization hold has been released immediately.
        Depending on your bank, it may take 1–5 business days to disappear from your statement.
      </p>
    </div>

    ${sectionHeading("Booking that could not be confirmed")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid #e7e5e4;border-radius:8px;padding:4px 20px;background:#fafaf9;">
      <tbody>${detailRows}</tbody>
    </table>

    <p style="margin:28px 0 0;font-size:15px;color:#57534e;line-height:1.6;text-align:center;">
      We apologize for the inconvenience. Please check our calendar for other available dates —
      we'd love to welcome you to ${config.name}.
    </p>

    ${ctaOutline}

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
    `We're Sorry — Booking Unavailable — ${config.name}`,
    ``,
    `Hi ${booking.guest.name.split(" ")[0]},`,
    ``,
    `Unfortunately your requested dates are no longer available. They were booked on`,
    `another platform just before we could confirm your reservation.`,
    ``,
    `YOUR CARD HAS NOT BEEN CHARGED`,
    `The payment authorization hold has been released immediately.`,
    `It may take 1–5 business days to disappear from your statement.`,
    ``,
    `BOOKING THAT COULD NOT BE CONFIRMED`,
    `Room:      ${booking.roomName}`,
    `Check-in:  ${fmtDate(booking.checkIn)}`,
    `Check-out: ${fmtDate(booking.checkOut)}`,
    `Nights:    ${booking.nights}`,
    `Guests:    ${guestsLabel}`,
    ``,
    isExpiry
      ? `We apologize for the delay in confirming your booking. Please check our calendar for available dates — we'd love to welcome you.`
      : `We apologize for the inconvenience. Please check our calendar for other available dates.`,
    ``,
    `Search available dates: ${baseUrl}`,
    ``,
    `${config.name} · ${config.location}`,
    config.adminEmail,
  ].join("\n");

  return { subject, html, text };
}
