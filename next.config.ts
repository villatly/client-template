import path from "path";
import type { NextConfig } from "next";

// ─── Production environment guard ─────────────────────────────────────────────
// Fail the build immediately if required env vars are missing in production.
// In development, the per-request validation in src/lib/stripe.ts handles this
// with a more actionable error message.
if (process.env.NODE_ENV === "production") {
  const required: Record<string, string> = {
    STRIPE_SECRET_KEY:
      "Required for payment processing. Get it from https://dashboard.stripe.com/apikeys",
    STRIPE_WEBHOOK_SECRET:
      "Required for webhook signature verification. Get it from the Stripe dashboard under Webhooks.",
    NEXT_PUBLIC_URL:
      "Required for Stripe redirect URLs. Set to your production domain, e.g. https://yourdomain.com",
    ADMIN_SESSION_SECRET:
      "Required for admin authentication. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    SUPABASE_URL:
      "Required for database access. Get it from your Supabase project → Settings → API.",
    SUPABASE_SERVICE_ROLE_KEY:
      "Required for database access. Get it from your Supabase project → Settings → API.",
  };

  const missing = Object.entries(required).filter(([key]) => !process.env[key]);
  if (missing.length > 0) {
    const list = missing.map(([k, hint]) => `  • ${k}\n    ${hint}`).join("\n");
    throw new Error(
      `\nMissing required environment variables for production build:\n\n${list}\n\n` +
        `Set these in your deployment environment (Vercel, Railway, etc.) and redeploy.\n` +
        `See client-template/.env.local.example for the full variable list.\n`
    );
  }

  // Warn if a test key is used in production (will not block the build, but is logged)
  if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    console.warn(
      "\n⚠️  Warning: STRIPE_SECRET_KEY is a test key but NODE_ENV is production.\n" +
        "   Real payments will NOT be processed. Replace with your live key when ready.\n"
    );
  }
}

// ─── Next.js config ───────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
  // Without this, Turbopack walks up to D:\LandigsBali (the .git root) and
  // uses it as the module resolution root — where there is no node_modules.
  // This fixes CSS @import "tailwindcss" resolution in dev mode.
  turbopack: {
    root: path.join(__dirname),
  },
  outputFileTracingRoot: path.join(__dirname),
  // Keep nodemailer as a native Node.js module (not bundled by webpack/Turbopack).
  // Required for SMTP email delivery in Vercel serverless functions.
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;
