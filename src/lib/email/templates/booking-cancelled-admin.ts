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

  const subject = wasPaid
    ? `[Action Required] Booking cancelled — refund needed — ${booking.confirmationCode}`
    : `Booking cancelled — ${booking.confirmationCode}`;

  const previewText = wasPaid
    ? `${booking.guest.name} cancelled their paid booking. Issue refund in Stripe.`
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
    wasPaid && booking.payment.intentId
      ? detailRow("PaymentIntent", `<span style="font-family:'Courier New',monospace;font-size:12px;">${booking.payment.intentId}</span>`)
      : "",
  ].join("");

  const refundBlock = wasPaid
    ? `<div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;padding:18px 24px;margin:0 0 28px;">
        <p style="margin:0;font-size:15px;font-weight:700;color:#991b1b;">⚠ &nbsp;Action required — issue refund</p>
        <p style="margin:8px 0 0;font-size:14px;color:#7f1d1d;line-height:1.6;">
          This guest paid <strong>${booking.currency} ${booking.totalPrice.toLocaleString()}</strong>.
          The booking has been cancelled and their dates are now free, but
          <strong>the refund must be issued manually from the Stripe Dashboard.</strong>
        </p>
        ${booking.payment.intentId
          ? `<p style="margin:10px 0 0;font-size:13px;color:#991b1b;line-height:1.5;">
              PaymentIntent: <span style="font-family:'Courier New',monospace;">${booking.payment.intentId}</span><br>
              Go to Stripe Dashboard → Payments → find this PI → click <strong>Refund</strong>.
            </p>`
          : `<p style="margin:10px 0 0;font-size:13px;color:#991b1b;">
              Find the payment in the Stripe Dashboard by guest email (${booking.guest.email}) and issue a refund.
            </p>`
        }
      </div>`
    : `<div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:14px 20px;margin:0 0 28px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#15803d;">✓ &nbsp;No refund needed</p>
        <p style="margin:4px 0 0;font-size:13px;color:#166534;">
          No payment was captured for this booking — no action required on Stripe.
        </p>
      </div>`;

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
    wasPaid
      ? `ACTION REQUIRED: This guest paid ${booking.currency} ${booking.totalPrice.toLocaleString()}. Issue a refund in the Stripe Dashboard.`
      : `No refund needed — no payment was captured.`,
    ``,
    booking.payment.intentId ? `PaymentIntent: ${booking.payment.intentId}` : "",
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
