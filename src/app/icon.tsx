/**
 * Dynamic favicon — served as /favicon.ico equivalent by Next.js App Router.
 *
 * Behaviour:
 *   1. If the admin has set branding.faviconUrl → use that image directly.
 *   2. Otherwise → generate a monogram icon: rounded square in the property's
 *      primary brand color with the first letter of the property name in white.
 *
 * The icon updates automatically whenever the admin saves new branding.
 */

import { ImageResponse } from "next/og";
import { getBranding, getConfig } from "@/lib/property";

export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const [branding, config] = await Promise.all([getBranding(), getConfig()]);

  // ── Custom favicon ────────────────────────────────────────────────────────
  if (branding.faviconUrl) {
    return new ImageResponse(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={branding.faviconUrl}
        style={{ width: 64, height: 64, objectFit: "cover" }}
        alt=""
      />,
      { width: 64, height: 64 }
    );
  }

  // ── Generated monogram ────────────────────────────────────────────────────
  const color = branding.primaryColor || "#1a1a1a";
  const letter = (config.name || "A").charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 14,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 38,
          color: "white",
          fontFamily: "Georgia, serif",
          fontWeight: 400,
          letterSpacing: "-1px",
        }}
      >
        {letter}
      </div>
    ),
    { width: 64, height: 64 }
  );
}
