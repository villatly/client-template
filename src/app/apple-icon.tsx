/**
 * Apple Touch Icon — 180×180 PNG for iOS home screen bookmarks.
 * Same logic as icon.tsx: custom URL if set, otherwise generated monogram.
 */

import { ImageResponse } from "next/og";
import { getBranding, getConfig } from "@/lib/property";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const [branding, config] = await Promise.all([getBranding(), getConfig()]);

  if (branding.faviconUrl) {
    return new ImageResponse(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={branding.faviconUrl}
        style={{ width: 180, height: 180, objectFit: "cover" }}
        alt=""
      />,
      { width: 180, height: 180 }
    );
  }

  const color = branding.primaryColor || "#1a1a1a";
  const letter = (config.name || "A").charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 108,
          color: "white",
          fontFamily: "Georgia, serif",
          fontWeight: 400,
          letterSpacing: "-2px",
        }}
      >
        {letter}
      </div>
    ),
    { width: 180, height: 180 }
  );
}
