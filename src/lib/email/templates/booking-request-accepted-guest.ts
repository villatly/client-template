/**
 * Email sent to the guest when the admin accepts their booking request (request_to_book mode).
 * Contains the Stripe payment link. The Checkout Session expires in 30 minutes.
 */

import type { Booking } from "@/lib/types";
import type { PropertyConfig, BrandingConfig } from "@/lib/types";
import { emailLayout, detailRow, sectionHeading, ctaButton, fmtDate } from "./base";

export function renderBookingRequestAcceptedGuest(
  booking:     Booking,
  checkoutUrl: string,
  config:      PropertyConfig,
  branding:    BrandingConfig,
): { subject: string; html: string; text: string } {
  const firstName = booking.guest.name.split(" ")[0];
  const subject   = `Your booking is accepted — complete payment to confirm`;
  const previewText = `Great news! Your request for ${booking.roomName} at ${config.name} has been accepted. Complete payment to confirm.`;

  const detailRows = [
    detailRow("Room",       booking.roomName),
    detailRow("Check-in",   fmtDate(booking.checkIn)),
    detailRow("Check-out",  fmtDate(booking.checkOut)),
    detailRow("Duration",   `${booking.nights} night${booking.nights !== 1 ? "s" : ""}`),
    detailRow("Amount due", `${booking.currency} ${booking.totalPrice.toLocaleString()}`),
  ].join("");

  const body = `
    <!-- Accepted badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:50px;padding:8px 22px;">
        <span style="color:#15803d;font-weight:700;font-size:14px;">✓ &nbsp;Request Accepted</span>
      </div>
    </div>

    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;text-align:center;">
      Great news, ${firstName}!
    </h2>
    <p style="margin:0 0 8px;font-size:15px;color:#57534e;line-height:1.6;text-align:center;">
      Your booking request for <strong>${booking.roomName}</strong> at <strong>${config.name}</strong> has been accepted.
    </p>
    <p style="margin:0 0 28px;font-size:13px;color:#a8a29e;text-align:center;">
      ⏱ Complete payment in the next <strong>30 minutes</strong> to confirm your dates.
    </p>

    ${sectionHeading("Booking summary")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid #e7e5e4;border-radius:8px;padding:4px 20px;background:#fafaf9;">
      <tbody>${detailRows}</tbody>
    </table>

    ${ctaButton("Complete Payment →", checkoutUrl, branding.primaryColor)}

    <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.6;text-align:center;">
      Secure payment powered by Stripe.<br>
      If the link expires, contact us at
      <a href="mailto:${config.adminEmail}" style="color:${branding.primaryColor};text-decoration:none;">${config.adminEmail}</a>
      and we'll send you a new one.
    </p>

    <hr style="border:none;border-top:1px solid #e7e5e4;margin:28px 0;">
    <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.6;">
      Payment link not working? Copy and paste this URL into your browser:<br>
      <span style="font-size:11px;word-break:break-all;">${checkoutUrl}</span>
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

  const text = `Great news, ${firstName}! — ${config.name}

Your booking request for ${booking.roomName} has been accepted.
Complete payment in the next 30 minutes to confirm your dates.

BOOKING SUMMARY
  Room:       ${booking.roomName}
  Check-in:   ${fmtDate(booking.checkIn)}
  Check-out:  ${fmtDate(booking.checkOut)}
  Nights:     ${booking.nights}
  Amount due: ${booking.currency} ${booking.totalPrice.toLocaleString()}

Complete payment here:
${checkoutUrl}

If the link expires, contact us at ${config.adminEmail} and we'll send you a new one.

${config.name} · ${config.location}`;

  return { subject, html, text };
}
