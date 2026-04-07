/**
 * Resend email provider.
 *
 * Uses the Resend REST API directly (no npm package dependency).
 * Requires RESEND_API_KEY in your environment.
 *
 * Sign up and get a free API key at: https://resend.com
 * Free tier: 3,000 emails/month, 100/day.
 *
 * To switch to a different provider later, implement the same interface
 * in a new file (e.g., providers/sendgrid.ts) and update the EMAIL_PROVIDER
 * env var and the dispatch in src/lib/email/index.ts.
 */

export interface EmailMessage {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendViaResend(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes("REPLACE")) {
    throw new Error(
      "RESEND_API_KEY is not configured. " +
      "Get your key at https://resend.com and set it in .env.local."
    );
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:    message.from,
      to:      Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html:    message.html,
      text:    message.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}
