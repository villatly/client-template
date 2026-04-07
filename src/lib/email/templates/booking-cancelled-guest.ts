import type { Booking } from "@/lib/types";
import type { PropertyConfig, BrandingConfig } from "@/lib/types";
import { emailLayout, detailRow, sectionHeading, fmtDate } from "./base";

export function renderBookingCancelledGuest(
  booking: Booking,
  config: PropertyConfig,
  branding: BrandingConfig,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const subject = `Your booking has been cancelled — ${config.name}`;
  const previewText = `Your booking for ${fmtDate(booking.checkIn)} at ${config.name} has been cancelled.`;

  const wasPaid = booking.payment.status === "paid";

  const guestsLabel = [
    `${booking.guest.adults} adult${booking.guest.adults !== 1 ? "s" : ""}`,
    booking.guest.children > 0
      ? `${booking.guest.children} child${booking.guest.children !== 1 ? "ren" : ""}`
      : "",
  ].filter(Boolean).join(", ");

  const detailRows = [
    detailRow("Confirmation",  booking.confirmationCode),
    detailRow("Room",          booking.roomName),
    detailRow("Check-in",      fmtDate(booking.checkIn)),
    detailRow("Check-out",     fmtDate(booking.checkOut)),
    detailRow("Duration",      `${booking.nights} night${booking.nights !== 1 ? "s" : ""}`),
    detailRow("Guests",        guestsLabel),
    detailRow("Total",         `${booking.currency} ${booking.totalPrice.toLocaleString()}`),
  ].join("");

  const refundNotice = wasPaid
    ? `<div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:10px;padding:18px 24px;margin:0 0 28px;text-align:center;">
        <p style="margin:0;font-size:15px;font-weight:700;color:#c2410c;">Refund information</p>
        <p style="margin:8px 0 0;font-size:13px;color:#9a3412;line-height:1.5;">
          As your booking was paid, please contact us directly at
          <a href="mailto:${config.adminEmail}" style="color:${branding.primaryColor};text-decoration:none;">${config.adminEmail}</a>
          to arrange your refund. We apologize for any inconvenience.
        </p>
      </div>`
    : `<div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:18px 24px;margin:0 0 28px;text-align:center;">
        <p style="margin:0;font-size:15px;font-weight:700;color:#15803d;">✓ &nbsp;No charge was made</p>
        <p style="margin:6px 0 0;font-size:13px;color:#166534;line-height:1.5;">
          Your payment was never captured, so no refund is needed.
        </p>
      </div>`;

  const body = `
    <!-- Status badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#f5f5f4;border:1.5px solid #d6d3d1;border-radius:50px;padding:8px 22px;">
        <span style="color:#57534e;font-weight:700;font-size:14px;">Booking Cancelled</span>
      </div>
    </div>

    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;text-align:center;">
      Your booking has been cancelled
    </h2>
    <p style="margin:0 0 28px;font-size:15px;color:#57534e;line-height:1.6;text-align:center;">
      Hi ${booking.guest.name.split(" ")[0]}, your reservation at ${config.name} has been cancelled.
      ${booking.cancellationReason ? `Reason: ${booking.cancellationReason}.` : ""}
    </p>

    ${refundNotice}

    ${sectionHeading("Cancelled booking")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid #e7e5e4;border-radius:8px;padding:4px 20px;background:#fafaf9;">
      <tbody>${detailRows}</tbody>
    </table>

    <p style="margin:28px 0 0;font-size:13px;color:#a8a29e;line-height:1.6;text-align:center;">
      Questions? Contact us at
      <a href="mailto:${config.adminEmail}" style="color:${branding.primaryColor};text-decoration:none;">${config.adminEmail}</a>
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0;">
      <tr>
        <td>
          <a href="${baseUrl}" target="_blank"
            style="display:inline-block;background:#ffffff;color:#1c1917;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:6px;letter-spacing:0.2px;border:1.5px solid #e7e5e4;">
            Search available dates →
          </a>
        </td>
      </tr>
    </table>
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
    `Booking Cancelled — ${config.name}`,
    ``,
    `Hi ${booking.guest.name.split(" ")[0]},`,
    ``,
    `Your reservation at ${config.name} has been cancelled.`,
    booking.cancellationReason ? `Reason: ${booking.cancellationReason}` : "",
    ``,
    wasPaid
      ? `REFUND: Please contact us at ${config.adminEmail} to arrange your refund.`
      : `NO CHARGE: Your payment was never captured, so no refund is needed.`,
    ``,
    `CANCELLED BOOKING`,
    `Confirmation: ${booking.confirmationCode}`,
    `Room:         ${booking.roomName}`,
    `Check-in:     ${fmtDate(booking.checkIn)}`,
    `Check-out:    ${fmtDate(booking.checkOut)}`,
    `Nights:       ${booking.nights}`,
    `Total:        ${booking.currency} ${booking.totalPrice.toLocaleString()}`,
    ``,
    `Questions? ${config.adminEmail}`,
    ``,
    `${config.name} · ${config.location}`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}
