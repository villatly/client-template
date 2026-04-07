import type { BrandingConfig } from "./types";

/**
 * Generates CSS custom properties from a branding config.
 * These are injected as inline styles on the property page wrapper,
 * allowing Tailwind theme colors to respond to per-property branding.
 */
export function getBrandingCSSVars(branding: BrandingConfig): React.CSSProperties {
  return {
    "--brand-primary": branding.primaryColor,
    "--brand-primary-light": lighten(branding.primaryColor, 20),
    "--brand-primary-dark": darken(branding.primaryColor, 15),
    "--brand-secondary": branding.secondaryColor,
    "--brand-secondary-light": lighten(branding.secondaryColor, 20),
    "--brand-accent": branding.accentColor,
  } as React.CSSProperties;
}

export function getButtonClass(style: BrandingConfig["buttonStyle"]): string {
  switch (style) {
    case "pill":
      return "rounded-full";
    case "square":
      return "rounded-none";
    case "rounded":
    default:
      return "rounded-lg";
  }
}

export function getFontClass(style: BrandingConfig["fontStyle"]): string {
  switch (style) {
    case "modern":
      return "font-sans";
    case "minimal":
      return "font-sans tracking-tight";
    case "serif":
    default:
      return "";
  }
}

// Simple hex color manipulation helpers

function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function lighten(hex: string, amount: number): string {
  const [h, s, l] = hexToHSL(hex);
  return hslToHex(h, s, Math.min(100, l + amount));
}

function darken(hex: string, amount: number): string {
  const [h, s, l] = hexToHSL(hex);
  return hslToHex(h, s, Math.max(0, l - amount));
}
