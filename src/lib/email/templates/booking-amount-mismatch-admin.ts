import type { Booking } from "@/lib/types";
import type { PropertyConfig, BrandingConfig } from "@/lib/types";
import { emailLayout, detailRow, sectionHeading, ctaButton, fmtDate } from "./base";

export function renderBookingAmountMismatchAdmin(
  booking: Booking,
  stripeAmountCents: number,
  expectedAmountCents: number,
  config: PropertyConfig,
  branding: BrandingConfig,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const subject = `[Action Required] Payment amount mismatch — ${booking.confirmationCode}`;
  const previewText = `Stripe charged ${booking.currency} ${(stripeAmountCents / 100).toLocaleString()} but the booking total was ${booking.currency} ${(expectedAmountCents / 100).toLocaleString()}.`;

  const stripeAmount  = (stripeAmountCents  / 100).toLocaleString();
  const expectedAmount = (expectedAmountCents / 100).toLocaleString();
  const diff = Math.abs(stripeAmountCents - expectedAmountCents);
  const diffFormatted = (diff / 100).toLocaleString();
  const overcharged = stripeAmountCents > expectedAmountCents;

  const bookingRows = [
    detailRow("Confirmation",    booking.confirmationCode),
    detailRow("Guest",           `${booking.guest.name} &lt;${booking.guest.email}&gt;`),
    detailRow("Room",            booking.roomName),
    detailRow("Check-in",        fmtDate(booking.checkIn)),
    detailRow("Check-out",       fmtDate(booking.checkOut)),
    detailRow("Booking total",   `${booking.currency} ${expectedAmount}`),
    detailRow("Stripe charged",  `<strong style="color:${overcharged ? "#c2410c" : "#1d4ed8"};">${booking.currency} ${stripeAmount}</strong>`),
    detailRow("Difference",      `<strong style="color:#c2410c;">${booking.currency} ${diffFormatted} ${overcharged ? "overcharged" : "undercharged"}</strong>`),
    booking.payment.intentId
      ? detailRow("PaymentIntent", `<span style="font-family:'Courier New',monospace;font-size:12px;">${booking.payment.intentId}</span>`)
      : "",
    booking.payment.sessionId
      ? detailRow("Session ID",   `<span style="font-family:'Courier New',monospace;font-size:12px;">${booking.payment.sessionId}</span>`)
      : "",
  ].join("");

  const body = `
    <!-- Alert badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#fff7ed;border:1.5px solid #fed7aa;border-radius:50px;padding:8px 22px;">
        <span style="color:#c2410c;font-weight:700;font-size:14px;">⚠ &nbsp;Payment Amount Mismatch</span>
      </div>
    </div>

    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;">Action required</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
      A booking was confirmed but the amount charged by Stripe does not match the
      calculated booking total. The booking has been confirmed and the guest notified,
      but the payment discrepancy requires your attention.
    </p>

    <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;padding:18px 24px;margin:0 0 28px;">
      <p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;">
        <strong>Stripe charged:</strong> ${booking.currency} ${stripeAmount}<br>
        <strong>Booking total:</strong> ${booking.currency} ${expectedAmount}<br>
        <strong>Difference:</strong> ${booking.currency} ${diffFormatted} (${overcharged ? "overcharged" : "undercharged"})
      </p>
      <p style="margin:12px 0 0;font-size:13px;color:#7f1d1d;line-height:1.5;">
        Most likely cause: a bug in the server-side price calculation. Check the Stripe
        dashboard to verify what was charged and issue a correction if needed.
      </p>
    </div>

    ${sectionHeading("Booking details")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid #e7e5e4;border-radius:8px;padding:4px 20px;background:#fafaf9;">
      <tbody>${bookingRows}</tbody>
    </table>

    ${ctaButton("Review in Admin Panel →", `${baseUrl}/admin/bookings`, branding.primaryColor)}
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
    `[Action Required] Payment Amount Mismatch — ${booking.confirmationCode}`,
    ``,
    `A booking was confirmed but the Stripe charge does not match the booking total.`,
    ``,
    `Stripe charged:  ${booking.currency} ${stripeAmount}`,
    `Booking total:   ${booking.currency} ${expectedAmount}`,
    `Difference:      ${booking.currency} ${diffFormatted} (${overcharged ? "overcharged" : "undercharged"})`,
    ``,
    `BOOKING`,
    `Confirmation: ${booking.confirmationCode}`,
    `Guest:        ${booking.guest.name} <${booking.guest.email}>`,
    `Room:         ${booking.roomName}`,
    `Check-in:     ${fmtDate(booking.checkIn)}`,
    `Check-out:    ${fmtDate(booking.checkOut)}`,
    booking.payment.intentId ? `PaymentIntent: ${booking.payment.intentId}` : "",
    ``,
    `Review in admin panel: ${baseUrl}/admin/bookings`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}
