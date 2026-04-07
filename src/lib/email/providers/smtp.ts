/**
 * SMTP email provider — works with Hostinger, Gmail, Outlook, or any SMTP server.
 *
 * Required environment variables:
 *   SMTP_HOST     — e.g. "smtp.hostinger.com"
 *   SMTP_PORT     — e.g. "465" (SSL) or "587" (STARTTLS)
 *   SMTP_USER     — your full email address, e.g. "admin@your-property.com"
 *   SMTP_PASS     — your email password (or app password for Gmail)
 *   SMTP_SECURE   — "true" for port 465 (SSL), "false" for port 587 (STARTTLS)
 *
 * Hostinger settings:
 *   SMTP_HOST=smtp.hostinger.com  SMTP_PORT=465  SMTP_SECURE=true
 *
 * Gmail app-password settings (2FA required):
 *   SMTP_HOST=smtp.gmail.com  SMTP_PORT=465  SMTP_SECURE=true
 *   SMTP_PASS=<16-char app password from myaccount.google.com/apppasswords>
 */

import type { EmailMessage } from "./resend";

export async function sendViaSMTP(message: EmailMessage): Promise<void> {
  const host    = process.env.SMTP_HOST;
  const port    = parseInt(process.env.SMTP_PORT ?? "465", 10);
  const user    = process.env.SMTP_USER;
  const pass    = process.env.SMTP_PASS;
  const secure  = (process.env.SMTP_SECURE ?? "true").toLowerCase() !== "false";

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not fully configured. " +
      "Set SMTP_HOST, SMTP_USER, and SMTP_PASS in your environment variables."
    );
  }

  // Dynamic import — keeps nodemailer out of the bundle for non-SMTP deployments
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,   // true = SSL (port 465); false = STARTTLS (port 587)
    auth: { user, pass },
    // Give Vercel serverless enough time (cold start + SMTP handshake)
    connectionTimeout: 10_000,
    socketTimeout:     15_000,
  });

  await transporter.sendMail({
    from:    message.from,
    to:      Array.isArray(message.to) ? message.to.join(", ") : message.to,
    subject: message.subject,
    html:    message.html,
    text:    message.text,
  });
}
