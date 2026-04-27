import SectionWrapper from "@/components/template/ui/SectionWrapper";
import Reveal from "@/components/template/ui/Reveal";
import type { DescriptionContent, PropertyIdentity } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";

interface AboutProps {
  description: DescriptionContent;
  identity: PropertyIdentity;
  layout?: LayoutPreset;
  bgColor?: string;
}

export default function About({ description, identity, layout = "default", bgColor }: AboutProps) {
  const typeLabels: Record<string, string> = {
    villa: "Villa",
    hostel: "Hostel",
    apartment: "Apartment",
    homestay: "Homestay",
    guesthouse: "Guesthouse",
  };

  const typeLabel = `${typeLabels[identity.propertyType]} · ${identity.location}`;

  // ─── Editorial ─────────────────────────────────────────────────────────────
  // White background. Left-accented heading. Asymmetric pull-quote + long copy.
  // All-white is intentional here — the contrast break comes in Amenities.

  if (layout === "editorial") {
    return (
      <section id="about" className="bg-white py-24 md:py-36 px-4" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-5xl">

          <Reveal className="mb-16">
            <div className="border-l-4 border-primary pl-7">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/70">
                {typeLabel}
              </p>
              <h2 className="text-4xl font-light leading-tight text-text sm:text-5xl lg:text-6xl">
                About {identity.name}
              </h2>
            </div>
          </Reveal>

          {/* With image: pull-quote + long text top row, image full-width below */}
          {description.image ? (
            <>
              <div className="grid gap-12 md:grid-cols-[5fr_7fr] md:gap-16 mb-12">
                <Reveal delay={100}>
                  <div className="relative">
                    <span
                      className="absolute -top-4 -left-2 select-none text-8xl font-serif leading-none text-primary/10"
                      aria-hidden="true"
                    >
                      &ldquo;
                    </span>
                    <p className="relative pt-8 text-xl font-light italic leading-relaxed text-text-secondary">
                      {description.short}
                    </p>
                  </div>
                </Reveal>
                <Reveal delay={200}>
                  <div className="text-base leading-relaxed text-text-muted whitespace-pre-line text-justify pt-1">
                    {description.long}
                  </div>
                </Reveal>
              </div>
              <Reveal delay={300} variant="fade">
                <div className="overflow-hidden rounded-2xl shadow-md aspect-[16/7]">
                  <img
                    src={description.image}
                    alt={`About ${identity.name}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </Reveal>
            </>
          ) : (
            <div className="grid gap-12 md:grid-cols-[5fr_7fr] md:gap-16">
              <Reveal delay={100}>
                <div className="relative">
                  <span
                    className="absolute -top-4 -left-2 select-none text-8xl font-serif leading-none text-primary/10"
                    aria-hidden="true"
                  >
                    &ldquo;
                  </span>
                  <p className="relative pt-8 text-xl font-light italic leading-relaxed text-text-secondary">
                    {description.short}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={200}>
                <div className="text-base leading-relaxed text-text-muted whitespace-pre-line text-justify pt-1">
                  {description.long}
                </div>
              </Reveal>
            </div>
          )}

        </div>
      </section>
    );
  }

  // ─── Resort ────────────────────────────────────────────────────────────────
  // Dark section. The typography here should feel like a statement, not a caption.
  // Very generous padding. Headline scales large. Short description at readable size.
  // max-w-4xl lets the text breathe rather than feeling compressed.

  if (layout === "resort") {
    return (
      <section id="about" className="bg-gray-950 py-32 md:py-48 px-4" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-4xl text-center">

          <Reveal>
            <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.5em] text-white/30">
              {typeLabel}
            </p>
            <h2 className="mb-10 text-4xl font-light text-white sm:text-5xl lg:text-6xl leading-tight">
              About {identity.name}
            </h2>
            <div className="mx-auto mb-12 h-px w-12 bg-white/15" />
          </Reveal>

          <Reveal delay={150} variant="fade">
            <p className="mb-8 text-xl leading-relaxed text-white/60 mx-auto max-w-2xl">
              {description.short}
            </p>
            <div className="text-sm leading-relaxed text-white/35 whitespace-pre-line mx-auto max-w-xl">
              {description.long}
            </div>
          </Reveal>

        </div>
      </section>
    );
  }

  // ─── Default ───────────────────────────────────────────────────────────────

  // With image: two-column layout, image right, text left
  if (description.image) {
    return (
      <SectionWrapper id="about" background="white" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">

            {/* Text */}
            <Reveal>
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
                {typeLabel}
              </p>
              <h2 className="mb-6 text-3xl sm:text-4xl text-text">
                About {identity.name}
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-text-secondary">
                {description.short}
              </p>
              <div className="text-base leading-relaxed text-text-muted whitespace-pre-line text-justify">
                {description.long}
              </div>
            </Reveal>

            {/* Image */}
            <Reveal delay={150} variant="fade">
              <div className="overflow-hidden rounded-2xl shadow-lg aspect-[4/3]">
                <img
                  src={description.image}
                  alt={`About ${identity.name}`}
                  className="h-full w-full object-cover"
                />
              </div>
            </Reveal>

          </div>
        </div>
      </SectionWrapper>
    );
  }

  // Without image: centered layout
  return (
    <SectionWrapper id="about" background="white" style={bgColor ? { backgroundColor: bgColor } : undefined}>
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          {typeLabel}
        </p>
        <h2 className="mb-6 text-3xl sm:text-4xl text-text">
          About {identity.name}
        </h2>
        <p className="mb-8 text-lg leading-relaxed text-text-secondary">
          {description.short}
        </p>
        <div className="text-base leading-relaxed text-text-muted whitespace-pre-line text-justify">
          {description.long}
        </div>
      </div>
    </SectionWrapper>
  );
}
