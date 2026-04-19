import SectionWrapper from "@/components/template/ui/SectionWrapper";
import Reveal from "@/components/template/ui/Reveal";
import type { GalleryItem } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";

interface GalleryProps {
  items: GalleryItem[];
  layout?: LayoutPreset;
  bgColor?: string;
}

export default function Gallery({ items, layout = "default", bgColor }: GalleryProps) {
  if (items.length === 0) return null;

  // ─── Editorial ─────────────────────────────────────────────────────────────
  // Asymmetric 12-col grid. Left-aligned header. Caption reveal on hover.
  // Images feel like they were placed by a photo editor, not a template.

  if (layout === "editorial") {
    return (
      <SectionWrapper id="gallery" background="white" style={bgColor ? { backgroundColor: bgColor } : undefined}>

        <Reveal className="mb-14">
          <div className="border-l-4 border-primary pl-7">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/70">
              Gallery
            </p>
            <h2 className="text-4xl font-light text-text sm:text-5xl">A Glimpse Inside</h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-12">
          {items.map((item, i) => {
            const colSpan =
              i === 0 ? "lg:col-span-8" :
              i === 1 ? "lg:col-span-4" :
              i === 2 ? "lg:col-span-4" :
              i === 3 ? "lg:col-span-8" :
              i % 2 === 0 ? "lg:col-span-7" : "lg:col-span-5";

            const aspect =
              i === 0 ? "aspect-[3/2]" :
              i === 1 || i === 2 ? "aspect-[3/4]" :
              "aspect-[4/3]";

            return (
              <div key={i} className={`group relative overflow-hidden rounded-sm ${colSpan}`}>
                <div className={`${aspect} w-full overflow-hidden`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.alt}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                {/* Caption overlay — slides up from bottom on hover */}
                <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/30 flex items-end">
                  {item.alt && (
                    <p className="w-full px-4 pb-4 text-xs italic text-white/0 group-hover:text-white/85 transition-all duration-500 translate-y-2 group-hover:translate-y-0 leading-snug">
                      {item.alt}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </SectionWrapper>
    );
  }

  // ─── Resort ────────────────────────────────────────────────────────────────
  // Dark background. First image: full-width panoramic banner.
  // Remaining: 3-col portrait grid with caption reveal on hover.
  // The gallery section feels like a luxury hotel lookbook — dark, moody, visual-first.

  if (layout === "resort") {
    return (
      <section id="gallery" className="bg-gray-950 py-20 md:py-28" style={bgColor ? { backgroundColor: bgColor } : undefined}>

        <Reveal className="mx-auto mb-12 max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-white/35">
            Gallery
          </p>
          <h2 className="text-3xl font-light text-white sm:text-4xl">A Glimpse Inside</h2>
        </Reveal>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3">

          {/* First image: wide cinematic banner */}
          <div className="group relative overflow-hidden">
            <div className="aspect-[16/7] w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={items[0].url}
                alt={items[0].alt}
                loading="eager"
                className="h-full w-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-[1.03]"
              />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-700 flex items-end">
              {items[0].alt && (
                <p className="px-6 pb-6 text-sm text-white/0 group-hover:text-white/75 transition-all duration-700 translate-y-2 group-hover:translate-y-0">
                  {items[0].alt}
                </p>
              )}
            </div>
          </div>

          {/* Remaining images: 3-col portrait grid */}
          {items.length > 1 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.slice(1).map((item, i) => (
                <div key={i} className="group relative overflow-hidden">
                  <div className="aspect-[3/4] w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-500 flex items-end">
                    {item.alt && (
                      <p className="px-4 pb-4 text-xs text-white/0 group-hover:text-white/80 transition-all duration-500 translate-y-2 group-hover:translate-y-0 leading-snug">
                        {item.alt}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>
    );
  }

  // ─── Default ───────────────────────────────────────────────────────────────
  // 3-col grid with featured first image spanning 2 cols + 2 rows.

  return (
    <SectionWrapper id="gallery" background="surface" style={bgColor ? { backgroundColor: bgColor } : undefined}>
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Gallery
        </p>
        <h2 className="text-3xl sm:text-4xl text-text">A Glimpse Inside</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div
            key={i}
            className={`group relative overflow-hidden rounded-lg ${
              i === 0 ? "sm:col-span-2 sm:row-span-2" : ""
            }`}
          >
            <div className={`${i === 0 ? "aspect-[4/3]" : "aspect-[3/2]"} w-full overflow-hidden`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.alt}
                loading={i === 0 ? "eager" : "lazy"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
