/**
 * Development email provider.
 *
 * Writes each email as an HTML file to .email-previews/ in the project root.
 * Also logs a one-line summary to the console so you know an email was "sent".
 *
 * To view an email: open the HTML file in your browser.
 * The directory is gitignored.
 */

import fs from "fs";
import path from "path";

export interface EmailMessage {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

const PREVIEW_DIR = path.join(process.cwd(), ".email-previews");

export async function sendViaDev(message: EmailMessage): Promise<void> {
  // Ensure the preview directory exists
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });

  const to = Array.isArray(message.to) ? message.to.join(", ") : message.to;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const slug = message.subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const filename = `${timestamp}_${slug}.html`;
  const filepath = path.join(PREVIEW_DIR, filename);

  // Wrap HTML with a dev banner so it's obvious this is a preview
  const devBanner = `
    <div style="background:#fef3c7;border:2px dashed #d97706;padding:12px 20px;margin-bottom:0;font-family:monospace;font-size:13px;">
      <strong>📧 DEV EMAIL PREVIEW</strong><br>
      <span style="color:#555;">From:</span> ${message.from}<br>
      <span style="color:#555;">To:</span> ${to}<br>
      <span style="color:#555;">Subject:</span> ${message.subject}
    </div>
  `;
  const previewHtml = `<!DOCTYPE html><html><body style="margin:0">${devBanner}${message.html}</body></html>`;

  fs.writeFileSync(filepath, previewHtml, "utf-8");

  console.log(
    `\n📧 Email (dev) → ${to}\n` +
    `   Subject : ${message.subject}\n` +
    `   Preview : .email-previews/${filename}\n`
  );
}
