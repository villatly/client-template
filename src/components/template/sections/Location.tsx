import SectionWrapper from "@/components/template/ui/SectionWrapper";
import type { LocationContent } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";

interface LocationProps {
  location: LocationContent;
  layout?: LayoutPreset;
}

function toEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("output=embed") || url.includes("/maps/embed")) return url;
  try {
    const parsed = new URL(url);
    const q = parsed.searchParams.get("q");
    if (q) return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/);
    if (placeMatch) return `https://maps.google.com/maps?q=${encodeURIComponent(decodeURIComponent(placeMatch[1]))}&output=embed`;
    parsed.searchParams.set("output", "embed");
    return parsed.toString();
  } catch {
    return url;
  }
}

export default function Location({ location, layout }: LocationProps) {
  const embedUrl = toEmbedUrl(location.mapUrl);

  if (layout === "editorial") {
    return (
      <SectionWrapper id="location" background="white">
        <div className="mx-auto max-w-4xl">

          <div className="mb-10 border-l-4 border-primary pl-7">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/70">
              Location
            </p>
            <h2 className="mb-5 text-4xl font-light text-text sm:text-5xl">
              {location.areaName}
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-text-secondary">
              {location.description}
            </p>
          </div>

          {/* Full-width map */}
          <div className="overflow-hidden rounded-sm shadow-md">
            <iframe
              src={embedUrl}
              className="h-80 w-full border-0 md:h-[420px]"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map of ${location.areaName}`}
            />
          </div>

        </div>
      </SectionWrapper>
    );
  }

  if (layout === "resort") {
    return (
      <section id="location" className="bg-white">
        {/* Full-width map (bleeds to container edges) */}
        <div className="overflow-hidden">
          <iframe
            src={embedUrl}
            className="h-[400px] w-full border-0 md:h-[520px]"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map of ${location.areaName}`}
          />
        </div>

        {/* Caption / text below */}
        <div className="py-14 px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
              Location
            </p>
            <h2 className="mb-4 text-2xl font-light text-text sm:text-3xl">{location.areaName}</h2>
            <p className="text-sm leading-relaxed text-text-secondary">{location.description}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <SectionWrapper id="location" background="white">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Location
          </p>
          <h2 className="mb-6 text-3xl sm:text-4xl text-text">{location.areaName}</h2>
          <p className="text-base leading-relaxed text-text-secondary">
            {location.description}
          </p>
        </div>
        <div className="overflow-hidden rounded-lg shadow-md">
          <iframe
            src={embedUrl}
            className="h-80 w-full border-0 lg:h-96"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map of ${location.areaName}`}
          />
        </div>
      </div>
    </SectionWrapper>
  );
}
