import Button from "@/components/template/ui/Button";
import type { ContactInfo, BrandingConfig } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";

interface ContactCTAProps {
  contact: ContactInfo;
  branding: BrandingConfig;
  propertyName: string;
  layout?: LayoutPreset;
  bgColor?: string;
}

export default function ContactCTA({ contact, branding, propertyName, layout, bgColor }: ContactCTAProps) {
  const ctaButtons = contact.ctaButtons ?? [];

  // ── Editorial variant ────────────────────────────────────────────────
  if (layout === "editorial") {
    return (
      <section id="contact" className="bg-gray-950 py-20 md:py-28 px-4" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

            {/* Left — large typographic headline */}
            <div>
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/30">
                Make a reservation
              </p>
              <h2 className="text-4xl font-light leading-tight text-white sm:text-5xl lg:text-6xl">
                Ready to experience {propertyName}?
              </h2>
              <div className="mt-8 h-px w-16 bg-white/20" />
            </div>

            {/* Right — CTAs and contact links */}
            <div className="flex flex-col gap-6">
              {ctaButtons.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {ctaButtons.map((btn, i) => (
                    <Button
                      key={i}
                      href={btn.url}
                      variant={i === 0 ? "secondary" : "outline"}
                      buttonStyle={branding.buttonStyle}
                      className={i > 0 ? "border-white/30 text-white hover:bg-white/10" : undefined}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-6 text-sm text-white/40">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="hover:text-white/70 transition-colors">
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="hover:text-white/70 transition-colors">
                    {contact.phone}
                  </a>
                )}
                {contact.whatsapp && (
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                    className="hover:text-white/70 transition-colors"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    );
  }

  // ── Resort variant ───────────────────────────────────────────────────
  if (layout === "resort") {
    return (
      <section id="contact" className="bg-gray-950 py-24 md:py-36 px-4" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-2xl text-center">

          <div className="mx-auto mb-10 h-px w-16 bg-white/15" />

          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.4em] text-white/30">
            Reserve your stay
          </p>
          <h2 className="mb-6 text-3xl font-light leading-tight text-white sm:text-4xl md:text-5xl">
            Ready to Book Your Stay?
          </h2>
          <p className="mb-12 text-base text-white/50 leading-relaxed">
            Get in touch and we&apos;ll help you plan the perfect stay at {propertyName}.
          </p>

          {ctaButtons.length > 0 && (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {ctaButtons.map((btn, i) => (
                <Button
                  key={i}
                  href={btn.url}
                  variant={i === 0 ? "secondary" : "outline"}
                  buttonStyle={branding.buttonStyle}
                  className={i > 0 ? "border-white/30 text-white hover:bg-white/10" : undefined}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-white/30">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="hover:text-white/60 transition-colors">
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="hover:text-white/60 transition-colors">
                {contact.phone}
              </a>
            )}
            {contact.whatsapp && (
              <a
                href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                className="hover:text-white/60 transition-colors"
              >
                WhatsApp
              </a>
            )}
          </div>

          <div className="mx-auto mt-14 h-px w-16 bg-white/10" />

        </div>
      </section>
    );
  }

  // ── Default variant ──────────────────────────────────────────────────
  return (
    <section id="contact" className="bg-primary py-20 md:py-28" style={bgColor ? { backgroundColor: bgColor } : undefined}>
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="mb-4 text-3xl text-white sm:text-4xl">
          Ready to Book Your Stay?
        </h2>
        <p className="mb-10 text-lg text-white/80">
          Get in touch and we&apos;ll help you plan the perfect stay at {propertyName}.
        </p>

        {ctaButtons.length > 0 && (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {ctaButtons.map((btn, i) => (
              <Button
                key={i}
                href={btn.url}
                variant={i === 0 ? "secondary" : "outline"}
                buttonStyle={branding.buttonStyle}
                className={i > 0 ? "border-white text-white hover:bg-white hover:text-gray-900" : undefined}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-white/60">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">
              {contact.email}
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="hover:text-white transition-colors">
              {contact.phone}
            </a>
          )}
          {contact.whatsapp && (
            <a
              href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
              className="hover:text-white transition-colors"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
