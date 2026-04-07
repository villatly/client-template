import { emailLayout } from "./base";

export function renderAdminLoginOTP(
  code: string,
  propertyName: string
): { subject: string; html: string; text: string } {
  const subject = `Your admin login code — ${code}`;
  const previewText = `Your one-time login code is ${code}. Valid for 15 minutes.`;

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;text-align:center;">
      Admin login code
    </h2>
    <p style="margin:0 0 28px;font-size:15px;color:#57534e;line-height:1.6;text-align:center;">
      Enter this code on the login page to access your admin panel.
    </p>

    <!-- OTP code block -->
    <div style="background:#1c1917;border-radius:10px;padding:24px;text-align:center;margin:0 0 28px;">
      <p style="margin:0 0 6px;font-size:11px;color:#a8a29e;letter-spacing:2px;text-transform:uppercase;">One-time code</p>
      <p style="margin:0;font-size:40px;font-weight:700;color:#ffffff;font-family:'Courier New',Courier,monospace;letter-spacing:10px;">${code}</p>
      <p style="margin:10px 0 0;font-size:12px;color:#78716c;">Expires in 15 minutes · Single use</p>
    </div>

    <p style="margin:0 0 16px;font-size:13px;color:#a8a29e;line-height:1.6;text-align:center;">
      If you did not request this code, you can safely ignore this email.<br>
      No one can access your account without the code.
    </p>
  `;

  const html = emailLayout({
    propertyName,
    location:     "",
    adminEmail:   "",
    primaryColor: "#1c1917",
    previewText,
    body,
  });

  const text = [
    `Admin login code — ${propertyName}`,
    ``,
    `Your one-time login code is: ${code}`,
    ``,
    `Enter this code on the admin login page.`,
    `It expires in 15 minutes and can only be used once.`,
    ``,
    `If you did not request this, ignore this email.`,
  ].join("\n");

  return { subject, html, text };
}
