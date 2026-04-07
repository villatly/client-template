import type { Booking } from "@/lib/types";
import type { PropertyConfig, BrandingConfig } from "@/lib/types";
import { emailLayout, detailRow, sectionHeading, ctaButton, fmtDate } from "./base";

export function renderBookingConfirmedAdmin(
  booking: Booking,
  config: PropertyConfig,
  branding: BrandingConfig,
  baseUrl: string
): { subject: string; html: string; text: string } {
  const guestsLabel = [
    `${booking.guest.adults} adult${booking.guest.adults !== 1 ? "s" : ""}`,
    booking.guest.children > 0
      ? `${booking.guest.children} child${booking.guest.children !== 1 ? "ren" : ""}`
      : "",
  ].filter(Boolean).join(", ");

  const subject = `[New Booking] ${booking.guest.name} · ${booking.roomName} · ${booking.checkIn}`;
  const previewText = `${booking.guest.name} booked ${booking.roomName} for ${booking.nights} nights. Total: ${booking.currency} ${booking.totalPrice.toLocaleString()}.`;

  const guestRows = [
    detailRow("Name",    booking.guest.name),
    detailRow("Email",   `<a href="mailto:${booking.guest.email}" style="color:${branding.primaryColor};text-decoration:none;">${booking.guest.email}</a>`),
    booking.guest.phone ? detailRow("Phone", booking.guest.phone) : "",
    detailRow("Guests",  guestsLabel),
    booking.guest.notes ? detailRow("Notes", booking.guest.notes) : "",
  ].join("");

  const bookingRows = [
    detailRow("Room",          booking.roomName),
    detailRow("Check-in",      fmtDate(booking.checkIn)),
    detailRow("Check-out",     fmtDate(booking.checkOut)),
    detailRow("Duration",      `${booking.nights} night${booking.nights !== 1 ? "s" : ""}`),
    detailRow("Total",         `${booking.currency} ${booking.totalPrice.toLocaleString()}`),
    detailRow("Confirmation",  booking.confirmationCode),
    booking.payment.intentId
      ? detailRow("Payment ID", `<span style="font-family:'Courier New',monospace;font-size:12px;color:#78716c;">${booking.payment.intentId}</span>`)
      : "",
    booking.payment.sessionId
      ? detailRow("Session ID", `<span style="font-family:'Courier New',monospace;font-size:12px;color:#78716c;">${booking.payment.sessionId}</span>`)
      : "",
  ].join("");

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1c1917;">New booking confirmed</h2>
    <p style="margin:0 0 28px;font-size:15px;color:#57534e;line-height:1.6;">
      A new booking has been confirmed and payment received at ${config.name}.
    </p>

    ${sectionHeading("Guest information")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="border:1px solid #e7e5e4;border-radius:8px;padding:4px 20px;background:#fafaf9;">
      <tbody>${guestRows}</tbody>
    </table>

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
    `[New Booking] ${booking.guest.name} · ${booking.roomName}`,
    ``,
    `A new booking has been confirmed at ${config.name}.`,
    ``,
    `GUEST`,
    `Name:   ${booking.guest.name}`,
    `Email:  ${booking.guest.email}`,
    booking.guest.phone ? `Phone:  ${booking.guest.phone}` : "",
    `Guests: ${guestsLabel}`,
    booking.guest.notes ? `Notes:  ${booking.guest.notes}` : "",
    ``,
    `BOOKING`,
    `Room:         ${booking.roomName}`,
    `Check-in:     ${fmtDate(booking.checkIn)}`,
    `Check-out:    ${fmtDate(booking.checkOut)}`,
    `Nights:       ${booking.nights}`,
    `Total:        ${booking.currency} ${booking.totalPrice.toLocaleString()}`,
    `Confirmation: ${booking.confirmationCode}`,
    booking.payment.intentId ? `PaymentIntent: ${booking.payment.intentId}` : "",
    ``,
    `Admin panel: ${baseUrl}/admin/bookings`,
  ].filter((l) => l !== undefined && l !== "").join("\n");

  return { subject, html, text };
}
