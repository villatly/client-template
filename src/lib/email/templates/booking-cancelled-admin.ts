import type { Booking } from "@/lib/types";
import type { PropertyConfig, BrandingConfig } from "@/lib/types";
import { emailLayout, detailRow, sectionHeading, ctaButton, fmtDate } from "./base";

export function renderBookingCancelledAdmin(
  booking: Booking,
  config: PropertyConfig,
  branding: BrandingConfig,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const wasPaid = booking.payment.status === "paid";
  const refundIssued =
    (booking.payment.refundAmount != null && booking.payment.refundAmount > 0) ||
    booking.payment.status === "refunded";

  const subject = wasPaid && !refundIssued
    ? `[Action Required] Booking cancelled — refund pending — ${booking.confirmationCode}`
    : `Booking cancelled — ${booking.confirmationCode}`;

  const previewText = wasPaid && !refundIssued
    ? `${booking.guest.name} had a paid booking. Issue the refund from your admin panel.`
    : `${booking.guest.name}'s booking has been cancelled. No charge was made.`;

  const bookingRows = [
    detailRow("Confirmation", booking.confirmationCode),
    detailRow("Guest",        `${booking.guest.name} &lt;${booking.guest.email}&gt;`),
    booking.guest.phone ? detailRow("Phone", booking.guest.phone) : "",
    detailRow("Room",         booking.roomName),
    detailRow("Check-in",     fmtDate(booking.checkIn)),
    detailRow("Check-out",    fmtDate(booking.checkOut)),
    detailRow("Nights",       `${booking.nights}`),
    detailRow("Total",        `${booking.currency} ${booking.totalPrice.toLocaleString()}`),
    booking.cancellationReason
      ? detailRow("Reason", booking.cancellationReason)
      : "",
  ].join("");

  let refundBlock: string;

  if (!wasPaid) {
    refundBlock = `
      <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:14px 20px;margin:0 0 28px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#15803d;">✓ &nbsp;No refund needed</p>
        <p style="margin:4px 0 0;font-size:13px;color:#166534;">
          No payment was captured for this booking — no action required.
        </p>
      </div>`;
  } else if (refundIssued) {
    const refundAmt = booking.payment.refundAmount ?? booking.totalPrice;
    refundBlock = `
      <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:14px 20px;margin:0 0 28px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#15803d;">✓ &nbsp;Refund already issued</p>
        <p style="margin:4px 0 0;font-size:13px;color:#166534;">
          ${booking.currency} ${refundAmt.toLocaleString()} was refunded before cancellation. No further action needed.
        </p>
      </div>`;
  } else {
    // Paid, no refund yet — point to admin panel
    refundBlock = `
      <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;padding:18px 24px;margin:0 0 28px;">
        <p style="margin:0;font-size:15px;font-weight:700;color:#991b1b;">⚠ &nbsp;Action required — issue refund</p>
        <p style="margin:8px 0 0;font-size:14px;color:#7f1d1d;line-height:1.6;">
          This guest paid <strong>${booking.currency} ${booking.totalPrice.toLocaleString()}</strong>.
          Open the booking in your admin panel and use the <strong>Issue Refund</strong> button to process it directly — no need to go to Stripe.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 0;">
          <tr>
            <td>
              <a href="${baseUrl}/admin/bookings"
                style="display:inline-block;background:#991b1b;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:6px;">
                Open Admin Panel → Issue Refund
              </a>
            </td>
          </tr>
        </table>
      </div>`;
  }

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;">Booking cancelled</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
      A reservation at ${config.name} has been cancelled.
    </p>

    ${refundBlock}

    ${sectionHeading("Booking details")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid #e7e5e4;border-radius:8px;padding:4px 20px;background:#fafaf9;">
      <tbody>${bookingRows}</tbody>
    </table>

    ${ctaButton("View in Admin Panel →", `${baseUrl}/admin/bookings`, branding.primaryColor)}
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
    subject,
    ``,
    wasPaid && !refundIssued
      ? `ACTION REQUIRED: This guest paid ${booking.currency} ${booking.totalPrice.toLocaleString()}. Open the admin panel and use the Issue Refund button: ${baseUrl}/admin/bookings`
      : refundIssued
        ? `Refund already issued — no further action needed.`
        : `No refund needed — no payment was captured.`,
    ``,
    `BOOKING`,
    `Confirmation: ${booking.confirmationCode}`,
    `Guest:        ${booking.guest.name} <${booking.guest.email}>`,
    booking.guest.phone ? `Phone:        ${booking.guest.phone}` : "",
    `Room:         ${booking.roomName}`,
    `Check-in:     ${fmtDate(booking.checkIn)}`,
    `Check-out:    ${fmtDate(booking.checkOut)}`,
    `Nights:       ${booking.nights}`,
    `Total:        ${booking.currency} ${booking.totalPrice.toLocaleString()}`,
    booking.cancellationReason ? `Reason:       ${booking.cancellationReason}` : "",
    ``,
    `Admin panel: ${baseUrl}/admin/bookings`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}
