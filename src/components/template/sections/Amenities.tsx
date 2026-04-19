import SectionWrapper from "@/components/template/ui/SectionWrapper";
import Reveal from "@/components/template/ui/Reveal";
import type { Amenity } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";

interface AmenitiesProps {
  amenities: Amenity[];
  layout?: LayoutPreset;
  bgColor?: string;
}

const iconMap: Record<string, string> = {
  wifi: "M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z",
  pool: "M3 15c2.483 0 4.345-1.5 5.25-2.25.905.75 2.767 2.25 5.25 2.25s4.345-1.5 5.25-2.25c.905.75 2.767 2.25 5.25 2.25M3 19.5c2.483 0 4.345-1.5 5.25-2.25.905.75 2.767 2.25 5.25 2.25s4.345-1.5 5.25-2.25c.905.75 2.767 2.25 5.25 2.25",
  parking: "M8 7h4a4 4 0 010 8H8V7zm0 0v8",
  restaurant: "M3 3h2v8h2V3h2v8l-1 1v9H4v-9L3 11V3zm14 0v7h3v4h-3v7h-2V3h2z",
  ac: "M12 3v18m-6-3l6-6 6 6M6 9l6 6 6-6",
  kitchen: "M4 4h16v16H4V4zm4 4h8m-8 4h8",
  laundry: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 6a4 4 0 110 8 4 4 0 010-8z",
  garden: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  spa: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  gym: "M4 7h4v10H4V7zm12 0h4v10h-4V7zM8 11h8v2H8v-2z",
  breakfast: "M3 13h18M12 3v4m-4 0a4 4 0 018 0M5 17h14v2H5v-2z",
  transfer: "M8 17l-3-3 3-3m8 6l3-3-3-3M3 14h18",
  security: "M12 2l7 4v5c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V6l7-4z",
  surfboard: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  default: "M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm4.5 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm5 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM12 14.5c-2 0-3 1-3 1h6s-1-1-3-1z",
};

export default function Amenities({ amenities, layout = "default", bgColor }: AmenitiesProps) {

  // ─── Editorial ─────────────────────────────────────────────────────────────
  // DARK INK SECTION — this is the single strongest contrast break on the
  // editorial page. After white hero → white about → white gallery → surface rooms,
  // this dark section acts like a chapter divide in a magazine.
  // No icons. Pure typographic list with horizontal rules.

  if (layout === "editorial") {
    return (
      <section id="amenities" className="bg-gray-900 py-24 md:py-32 px-4" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-5xl">

          <Reveal className="mb-14">
            <div className="border-l-4 border-white/25 pl-7">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">
                Amenities
              </p>
              <h2 className="text-4xl font-light text-white sm:text-5xl">Everything You Need</h2>
            </div>
          </Reveal>

          {/* Two-column typographic list — no icons, no cards */}
          <Reveal variant="fade" delay={100}>
            <div className="grid grid-cols-1 gap-x-16 sm:grid-cols-2">
              {amenities.map((amenity, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-white/10 py-4"
                >
                  <span className="text-sm text-white/65">{amenity.label}</span>
                  <span className="text-white/20 text-xs ml-4">—</span>
                </div>
              ))}
            </div>
          </Reveal>

        </div>
      </section>
    );
  }

  // ─── Resort ────────────────────────────────────────────────────────────────
  // Dark background. Spa-menu presentation — centered icons at reduced weight,
  // all-caps micro-labels. Stagger-reveal on scroll for a considered feel.

  if (layout === "resort") {
    return (
      <section id="amenities" className="bg-gray-950 py-24 md:py-32 px-4" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-5xl">

          <Reveal className="mb-16 text-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-white/30">
              Amenities
            </p>
            <h2 className="text-3xl font-light text-white sm:text-4xl">Everything You Need</h2>
            <div className="mx-auto mt-8 h-px w-10 bg-white/15" />
          </Reveal>

          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {amenities.map((amenity, i) => {
              const iconPath = iconMap[amenity.icon || "default"] || iconMap.default;
              return (
                <Reveal key={i} delay={Math.min(i * 40, 400)} variant="fade">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <svg
                      className="h-5 w-5 text-white/40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.25}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                    </svg>
                    <span className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase leading-tight">
                      {amenity.label}
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </div>

        </div>
      </section>
    );
  }

  // ─── Default ───────────────────────────────────────────────────────────────

  return (
    <SectionWrapper id="amenities" background="surface-alt" style={bgColor ? { backgroundColor: bgColor } : undefined}>
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Amenities
        </p>
        <h2 className="text-3xl sm:text-4xl text-text">Everything You Need</h2>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {amenities.map((amenity, i) => {
          const iconPath = iconMap[amenity.icon || "default"] || iconMap.default;
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-3 rounded-lg bg-white p-6 text-center shadow-sm"
            >
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
              </svg>
              <span className="text-sm text-text-secondary">{amenity.label}</span>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
