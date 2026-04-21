import type { Booking } from "@/lib/types";
import type { PropertyConfig, BrandingConfig } from "@/lib/types";
import { emailLayout, detailRow, sectionHeading, ctaButton, fmtDate } from "./base";

/**
 * Admin alert sent when Stripe's PaymentIntent capture fails after a successful
 * authorization. The booking is left in payment_authorized (dates blocked).
 * Admin must resolve manually: either force-confirm or cancel the booking.
 */
export function renderBookingCaptureFailedAdmin(
  booking: Booking,
  intentId: string,
  captureError: string,
  config: PropertyConfig,
  branding: BrandingConfig,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const subject = `[Action Required] Payment capture failed — ${booking.confirmationCode}`;
  const previewText = `Stripe payment was authorized but capture failed for ${booking.guest.name}. Manual action required.`;

  const bookingRows = [
    detailRow("Confirmation",  booking.confirmationCode),
    detailRow("Guest",         `${booking.guest.name} &lt;${booking.guest.email}&gt;`),
    detailRow("Room",          booking.roomName),
    detailRow("Check-in",      fmtDate(booking.checkIn)),
    detailRow("Check-out",     fmtDate(booking.checkOut)),
    detailRow("Total",         `${booking.currency} ${booking.totalPrice.toLocaleString()}`),
    detailRow("PaymentIntent", `<span style="font-family:'Courier New',monospace;font-size:12px;">${intentId}</span>`),
    booking.payment.sessionId
      ? detailRow("Session ID", `<span style="font-family:'Courier New',monospace;font-size:12px;">${booking.payment.sessionId}</span>`)
      : "",
    detailRow("Error",         `<span style="color:#c2410c;font-size:13px;">${captureError}</span>`),
  ].join("");

  const body = `
    <!-- Alert badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#fff7ed;border:1.5px solid #fed7aa;border-radius:50px;padding:8px 22px;">
        <span style="color:#c2410c;font-weight:700;font-size:14px;">⚠ &nbsp;Payment Capture Failed</span>
      </div>
    </div>

    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;">Manual action required</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
      A guest's payment was authorized by their bank but the capture step failed.
      The booking is currently in <strong>payment_authorized</strong> status — the dates
      are tentatively blocked and the guest's card has a hold on it.
    </p>

    <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;padding:18px 24px;margin:0 0 28px;">
      <p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;font-weight:600;">
        What you need to do:
      </p>
      <ol style="margin:8px 0 0;padding-left:20px;font-size:14px;color:#7f1d1d;line-height:1.8;">
        <li>Open the Stripe Dashboard and find PaymentIntent <code style="font-family:'Courier New',monospace;">${intentId}</code></li>
        <li>Check whether the capture actually succeeded despite the error</li>
        <li>
          If capture <strong>succeeded</strong>: use <em>Force Confirm</em> in the admin panel to mark the booking confirmed<br>
          If capture <strong>failed</strong>: cancel the booking in the admin panel to void the hold and free the dates
        </li>
        <li>Contact the guest to advise them of the outcome</li>
      </ol>
    </div>

    ${sectionHeading("Booking details")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid #e7e5e4;border-radius:8px;padding:4px 20px;background:#fafaf9;">
      <tbody>${bookingRows}</tbody>
    </table>

    ${ctaButton("Open Admin Panel →", `${baseUrl}/admin/bookings`, branding.primaryColor)}

    <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.6;">
      This booking will remain in <em>payment_authorized</em> until you take action.
      The guest has not been notified of this issue yet.
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
    `[Action Required] Payment Capture Failed — ${booking.confirmationCode}`,
    ``,
    `A guest's payment was authorized but the capture step failed.`,
    `The booking is in payment_authorized status — dates blocked, card hold active.`,
    ``,
    `WHAT TO DO:`,
    `1. Find PaymentIntent ${intentId} in the Stripe Dashboard`,
    `2. Check whether capture actually succeeded despite the error`,
    `3a. If succeeded: use Force Confirm in the admin panel`,
    `3b. If failed: cancel the booking to void the hold and free the dates`,
    `4. Contact the guest to advise them of the outcome`,
    ``,
    `BOOKING`,
    `Confirmation: ${booking.confirmationCode}`,
    `Guest:        ${booking.guest.name} <${booking.guest.email}>`,
    `Room:         ${booking.roomName}`,
    `Check-in:     ${fmtDate(booking.checkIn)}`,
    `Check-out:    ${fmtDate(booking.checkOut)}`,
    `Total:        ${booking.currency} ${booking.totalPrice.toLocaleString()}`,
    `PaymentIntent: ${intentId}`,
    `Error:        ${captureError}`,
    ``,
    `Admin panel: ${baseUrl}/admin/bookings`,
  ].join("\n");

  return { subject, html, text };
}
