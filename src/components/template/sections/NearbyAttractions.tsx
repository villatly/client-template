import SectionWrapper from "@/components/template/ui/SectionWrapper";
import type { NearbyAttraction } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";

interface NearbyAttractionsProps {
  attractions: NearbyAttraction[];
  layout?: LayoutPreset;
}

export default function NearbyAttractions({ attractions, layout }: NearbyAttractionsProps) {
  if (layout === "editorial") {
    return (
      <section id="nearby" className="bg-white py-24 md:py-32 px-4">
        <div className="mx-auto max-w-4xl">

          <div className="mb-14 border-l-4 border-primary pl-7">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/70">
              Explore
            </p>
            <h2 className="text-4xl font-light text-text sm:text-5xl">Nearby Attractions</h2>
          </div>

          <div className="grid gap-0 sm:grid-cols-2">
            {attractions.map((attraction, i) => {
              const num = String(i + 1).padStart(2, "0");
              return (
                <div key={i} className="border-b border-border/60 py-8 pr-8">
                  <div className="flex items-start gap-5">
                    <span className="shrink-0 text-3xl font-light leading-none text-primary/20 tabular-nums">
                      {num}
                    </span>
                    <div>
                      <h3 className="text-base font-medium text-text leading-tight">{attraction.name}</h3>
                      {attraction.travelTime && (
                        <p className="mt-1 text-xs font-medium tracking-wide text-primary/70">
                          {attraction.travelTime}
                        </p>
                      )}
                      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{attraction.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
    );
  }

  if (layout === "resort") {
    return (
      <section id="nearby" className="bg-gray-950 py-24 px-4">
        <div className="mx-auto max-w-4xl">

          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Explore</p>
            <h2 className="text-3xl font-light text-white sm:text-4xl">Nearby Attractions</h2>
          </div>

          <div className="grid gap-0 sm:grid-cols-2">
            {attractions.map((attraction, i) => (
              <div key={i} className="flex gap-4 border-b border-white/10 py-7 pr-8">
                {/* Pin icon */}
                <div className="mt-1 shrink-0">
                  <svg className="h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/80">{attraction.name}</h3>
                  {attraction.travelTime && (
                    <p className="mt-0.5 text-xs text-white/40">{attraction.travelTime}</p>
                  )}
                  <p className="mt-2 text-xs leading-relaxed text-white/50">{attraction.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
    );
  }

  return (
    <SectionWrapper id="nearby" background="surface-alt">
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Explore
        </p>
        <h2 className="text-3xl sm:text-4xl text-text">Nearby Attractions</h2>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
        {attractions.map((attraction, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-lg bg-white p-6 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-medium text-text">{attraction.name}</h3>
              {attraction.travelTime && (
                <p className="mt-1 text-xs font-medium text-primary">
                  {attraction.travelTime}
                </p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {attraction.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
