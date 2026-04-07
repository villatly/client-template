/**
 * Base HTML email layout.
 *
 * Generates a full HTML document around the provided body content.
 * Uses table-based layout and inline styles for maximum email client compatibility
 * (Gmail, Outlook, Apple Mail, etc.).
 *
 * Usage:
 *   import { emailLayout } from "./base";
 *   const html = emailLayout({ propertyName, location, adminEmail, primaryColor, previewText, body });
 */

export interface LayoutOptions {
  propertyName: string;
  location: string;
  adminEmail: string;
  primaryColor: string;   // hex, e.g. "#29653b"
  previewText: string;    // shown in inbox preview pane (hidden in email body)
  body: string;           // inner HTML, injected into the card content area
}

export function emailLayout(opts: LayoutOptions): string {
  const { propertyName, location, adminEmail, primaryColor, previewText, body } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${propertyName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Hidden preview text (shown in inbox snippet, not in body) -->
  <div style="display:none;font-size:1px;color:#f5f5f4;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:32px 16px;background:#f5f5f4;">

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${primaryColor};padding:28px 40px;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.3px;">${propertyName}</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.65);font-size:13px;">${location}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafaf9;border-top:1px solid #e7e5e4;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.7;">
                Questions? Reply to this email or contact us at
                <a href="mailto:${adminEmail}" style="color:#a8a29e;text-decoration:underline;">${adminEmail}</a><br>
                ${propertyName} &middot; ${location}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** Renders a two-column detail row for booking/guest info tables. */
export function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:14px;color:#78716c;width:38%;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#1c1917;font-weight:500;vertical-align:top;">${value}</td>
  </tr>`;
}

/** Renders a section heading inside the email body. */
export function sectionHeading(text: string): string {
  return `<p style="margin:28px 0 12px;font-size:11px;font-weight:600;color:#a8a29e;letter-spacing:1.5px;text-transform:uppercase;">${text}</p>`;
}

/** Renders a primary CTA button. */
export function ctaButton(label: string, href: string, color: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr>
      <td>
        <a href="${href}" target="_blank"
          style="display:inline-block;background:${color};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:6px;letter-spacing:0.2px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Formats a date string (YYYY-MM-DD) for display. */
export function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month:   "long",
    day:     "numeric",
    year:    "numeric",
  });
}
