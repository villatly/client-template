import type { Booking } from "@/lib/types";
import type { PropertyConfig, BrandingConfig } from "@/lib/types";
import { emailLayout, detailRow, sectionHeading, ctaButton, fmtDate } from "./base";

export function renderBookingPendingPayment(
  booking: Booking,
  checkoutUrl: string,
  config: PropertyConfig,
  branding: BrandingConfig
): { subject: string; html: string; text: string } {
  const subject = `Complete your payment — ${booking.roomName} at ${config.name}`;
  const previewText = `Your dates are held — complete payment in the next 30 minutes to confirm your stay at ${config.name}.`;
  const firstName = booking.guest.name.split(" ")[0];

  const detailsRows = [
    detailRow("Room",      booking.roomName),
    detailRow("Check-in",  fmtDate(booking.checkIn)),
    detailRow("Check-out", fmtDate(booking.checkOut)),
    detailRow("Duration",  `${booking.nights} night${booking.nights !== 1 ? "s" : ""}`),
    detailRow("Total",     `${booking.currency} ${booking.totalPrice.toLocaleString()}`),
  ].join("");

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;">Almost there, ${firstName}!</h2>
    <p style="margin:0 0 8px;font-size:15px;color:#57534e;line-height:1.6;">
      Your dates at <strong>${config.name}</strong> are being held. Complete payment now to lock in your reservation.
    </p>
    <p style="margin:0 0 28px;font-size:13px;color:#a8a29e;">
      ⏱ This payment link is valid for <strong>30 minutes</strong>.
    </p>

    ${sectionHeading("Booking summary")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid #e7e5e4;border-radius:8px;padding:4px 20px;background:#fafaf9;">
      <tbody>${detailsRows}</tbody>
    </table>

    ${ctaButton("Complete Payment →", checkoutUrl, branding.primaryColor)}

    <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.6;text-align:center;">
      If the link expires, your dates will be released — simply start a new booking on our website.
    </p>

    <hr style="border:none;border-top:1px solid #e7e5e4;margin:28px 0;">
    <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.6;">
      <strong>Already paid?</strong> This email was sent automatically the moment your booking was created —
      you may have completed payment seconds later. If so, ignore this email and look out
      for your booking confirmation which will arrive shortly.
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
    `Complete your payment — ${booking.roomName} at ${config.name}`,
    ``,
    `Almost there, ${firstName}!`,
    ``,
    `Your dates at ${config.name} are being held. Complete payment in the next 30 minutes to confirm your reservation.`,
    ``,
    `BOOKING SUMMARY`,
    `Room:      ${booking.roomName}`,
    `Check-in:  ${fmtDate(booking.checkIn)}`,
    `Check-out: ${fmtDate(booking.checkOut)}`,
    `Nights:    ${booking.nights}`,
    `Total:     ${booking.currency} ${booking.totalPrice.toLocaleString()}`,
    ``,
    `Complete payment here:`,
    checkoutUrl,
    ``,
    `If the link expires, your dates will be released — start a new booking on our website.`,
    ``,
    `Already paid? This email was sent automatically at the moment your booking was created.`,
    `If you completed payment, ignore this — your confirmation will arrive shortly.`,
    ``,
    `${config.name} · ${config.location}`,
    config.adminEmail,
  ].join("\n");

  return { subject, html, text };
}
