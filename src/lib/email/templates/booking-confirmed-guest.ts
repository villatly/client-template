import type { Booking } from "@/lib/types";
import type { PropertyConfig, BrandingConfig } from "@/lib/types";
import { emailLayout, detailRow, sectionHeading, ctaButton, fmtDate } from "./base";

export function renderBookingConfirmedGuest(
  booking: Booking,
  config: PropertyConfig,
  branding: BrandingConfig,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const subject = `Booking confirmed — ${booking.confirmationCode} — ${config.name}`;
  const previewText = `Your stay at ${config.name} is confirmed. Confirmation code: ${booking.confirmationCode}`;

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
    booking.payment.status === "paid"
      ? detailRow("Payment",    `Paid via card`)
      : "",
  ].join("");

  const body = `
    <!-- Confirmed badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:50px;padding:8px 22px;">
        <span style="color:#15803d;font-weight:700;font-size:14px;">✓ &nbsp;Booking Confirmed</span>
      </div>
    </div>

    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;text-align:center;">
      Your stay is confirmed, ${booking.guest.name.split(" ")[0]}!
    </h2>
    <p style="margin:0 0 28px;font-size:15px;color:#57534e;line-height:1.6;text-align:center;">
      We look forward to welcoming you to ${config.name}.
    </p>

    <!-- Confirmation code -->
    <div style="background:#1c1917;border-radius:10px;padding:20px 24px;text-align:center;margin:0 0 28px;">
      <p style="margin:0 0 4px;font-size:11px;color:#a8a29e;letter-spacing:2px;text-transform:uppercase;">Confirmation Code</p>
      <p style="margin:0;font-size:30px;font-weight:700;color:#ffffff;font-family:'Courier New',Courier,monospace;letter-spacing:5px;">${booking.confirmationCode}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#78716c;">Keep this code — you may need it to manage your booking.</p>
    </div>

    ${sectionHeading("Reservation details")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid #e7e5e4;border-radius:8px;padding:4px 20px;background:#fafaf9;">
      <tbody>${detailRows}</tbody>
    </table>

    ${booking.guest.notes ? `
    ${sectionHeading("Special requests")}
    <p style="margin:0;font-size:14px;color:#57534e;line-height:1.6;background:#fafaf9;border:1px solid #e7e5e4;border-radius:8px;padding:14px 18px;">${booking.guest.notes}</p>
    ` : ""}

    ${ctaButton("View booking details →", `${baseUrl}/booking/confirm/${booking.id}`, branding.primaryColor)}

    <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.6;text-align:center;">
      Have questions? Reply to this email or contact us at
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
    `Booking Confirmed — ${config.name}`,
    ``,
    `Hi ${booking.guest.name.split(" ")[0]},`,
    ``,
    `Your booking is confirmed! We look forward to welcoming you.`,
    ``,
    `CONFIRMATION CODE: ${booking.confirmationCode}`,
    ``,
    `RESERVATION DETAILS`,
    `Room:      ${booking.roomName}`,
    `Check-in:  ${fmtDate(booking.checkIn)}`,
    `Check-out: ${fmtDate(booking.checkOut)}`,
    `Nights:    ${booking.nights}`,
    `Guests:    ${guestsLabel}`,
    `Total:     ${booking.currency} ${booking.totalPrice.toLocaleString()}`,
    booking.payment.status === "paid" ? `Payment:   Paid via card` : "",
    ``,
    booking.guest.notes ? `Special requests: ${booking.guest.notes}\n` : "",
    `View your booking: ${baseUrl}/booking/confirm/${booking.id}`,
    ``,
    `${config.name} · ${config.location}`,
    config.adminEmail,
  ].filter((l) => l !== undefined).join("\n");

  return { subject, html, text };
}
