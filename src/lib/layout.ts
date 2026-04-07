/**
 * Layout preset definitions.
 *
 * Presets control the visual composition of the public-facing property page.
 * The same sections and content model are used for every preset —
 * only the internal structure, spacing, and presentation change.
 *
 * "default"   — Basic. Included in all plans.
 * "editorial" — Premium. Magazine-style split hero, typographic emphasis.
 * "resort"    — Premium. Immersive frosted hero, horizontal room cards, dark sections.
 */

export type LayoutPreset = "default" | "editorial" | "resort";

export interface LayoutMeta {
  label: string;
  description: string;
  premium: boolean;
}

export const LAYOUT_PRESETS: Record<LayoutPreset, LayoutMeta> = {
  default: {
    label: "Default",
    description:
      "Clean, centered layout with a full-bleed hero, card-based rooms, and balanced section spacing. Works for any property type.",
    premium: false,
  },
  editorial: {
    label: "Editorial",
    description:
      "Magazine-style split hero, left-aligned typographic headings, asymmetric gallery, and pull-quote reviews. Best for boutique villas and design-forward properties.",
    premium: true,
  },
  resort: {
    label: "Resort",
    description:
      "Frosted-glass hero panel, horizontal room cards, and dark accent sections for Reviews and About. Best for luxury resorts and full-service properties.",
    premium: true,
  },
};
