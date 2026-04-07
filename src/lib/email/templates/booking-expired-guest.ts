import type { Booking } from "@/lib/types";
import type { PropertyConfig, BrandingConfig } from "@/lib/types";
import { emailLayout, detailRow, sectionHeading, fmtDate } from "./base";

export function renderBookingExpiredGuest(
  booking: Booking,
  config: PropertyConfig,
  branding: BrandingConfig,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const subject = `Your booking session has expired — ${config.name}`;
  const previewText = `Your payment session timed out. No charge was made. You can start a new booking anytime.`;

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
  ].join("");

  // Outline CTA
  const ctaOutline = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr>
      <td>
        <a href="${baseUrl}" target="_blank"
          style="display:inline-block;background:#ffffff;color:#1c1917;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:6px;letter-spacing:0.2px;border:1.5px solid #e7e5e4;">
          Check availability →
        </a>
      </td>
    </tr>
  </table>`;

  const body = `
    <!-- Status badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#f5f5f4;border:1.5px solid #e7e5e4;border-radius:50px;padding:8px 22px;">
        <span style="color:#78716c;font-weight:700;font-size:14px;">Session expired — no charge made</span>
      </div>
    </div>

    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;text-align:center;">
      Your booking session expired
    </h2>
    <p style="margin:0 0 28px;font-size:15px;color:#57534e;line-height:1.6;text-align:center;">
      Hi ${booking.guest.name.split(" ")[0]}, your payment window for the booking below
      closed before payment was completed. This happens when the checkout page is open
      for more than 30 minutes without a completed payment.
    </p>

    <!-- No charge notice -->
    <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:18px 24px;margin:0 0 28px;text-align:center;">
      <p style="margin:0;font-size:15px;font-weight:700;color:#15803d;">✓ &nbsp;No charge was made</p>
      <p style="margin:6px 0 0;font-size:13px;color:#166534;line-height:1.5;">
        Your card was not charged. The dates are now back in our calendar.
      </p>
    </div>

    ${sectionHeading("Booking that was not completed")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid #e7e5e4;border-radius:8px;padding:4px 20px;background:#fafaf9;">
      <tbody>${detailRows}</tbody>
    </table>

    <p style="margin:28px 0 0;font-size:15px;color:#57534e;line-height:1.6;text-align:center;">
      The dates may still be available. Start a new booking anytime to check.
    </p>

    ${ctaOutline}

    <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.6;text-align:center;">
      Questions? Contact us at
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
    `Your booking session expired — ${config.name}`,
    ``,
    `Hi ${booking.guest.name.split(" ")[0]},`,
    ``,
    `Your payment session for the booking below expired before payment was completed.`,
    `This happens when the checkout page is open for more than 30 minutes without a`,
    `completed payment.`,
    ``,
    `NO CHARGE WAS MADE`,
    `Your card was not charged. The dates are now back in our calendar.`,
    ``,
    `BOOKING THAT WAS NOT COMPLETED`,
    `Room:      ${booking.roomName}`,
    `Check-in:  ${fmtDate(booking.checkIn)}`,
    `Check-out: ${fmtDate(booking.checkOut)}`,
    `Nights:    ${booking.nights}`,
    `Guests:    ${guestsLabel}`,
    ``,
    `The dates may still be available — start a new booking anytime:`,
    baseUrl,
    ``,
    `${config.name} · ${config.location}`,
    config.adminEmail,
  ].join("\n");

  return { subject, html, text };
}
