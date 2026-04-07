import type { PropertyIdentity, ContactInfo } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";

interface FooterProps {
  identity: PropertyIdentity;
  contact: ContactInfo;
  layout?: LayoutPreset;
}

export default function Footer({ identity, contact, layout }: FooterProps) {
  const year = new Date().getFullYear();

  if (layout === "editorial") {
    return (
      <footer className="bg-gray-950 py-16 px-4">
        <div className="mx-auto max-w-6xl">

          {/* Top: wordmark */}
          <div className="mb-10">
            <p className="text-3xl md:text-4xl font-light text-white tracking-tight">{identity.name}</p>
            <p className="mt-1 text-sm italic text-white/30">{identity.location}, {identity.country}</p>
          </div>

          {/* Thin divider */}
          <div className="mb-10 h-px bg-white/10" />

          {/* Middle row: links + contact */}
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <nav className="flex flex-wrap gap-x-8 gap-y-2">
              <a href="#about" className="text-sm text-white/40 hover:text-white transition-colors">About</a>
              <a href="#rooms" className="text-sm text-white/40 hover:text-white transition-colors">Rooms</a>
              <a href="#gallery" className="text-sm text-white/40 hover:text-white transition-colors">Gallery</a>
              <a href="#contact" className="text-sm text-white/40 hover:text-white transition-colors">Contact</a>
            </nav>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="text-sm text-white/40 hover:text-white transition-colors">
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="text-sm text-white/40 hover:text-white transition-colors">
                  {contact.phone}
                </a>
              )}
              {contact.whatsapp && (
                <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} className="text-sm text-white/40 hover:text-white transition-colors">
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Copyright + legal */}
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-1">
            <p className="text-xs text-white/20">
              &copy; {year} {identity.name}. All rights reserved.
            </p>
            <a href="/terms" className="text-xs text-white/20 hover:text-white/40 transition-colors">Terms</a>
            <a href="/privacy" className="text-xs text-white/20 hover:text-white/40 transition-colors">Privacy</a>
          </div>

        </div>
      </footer>
    );
  }

  if (layout === "resort") {
    return (
      <footer className="bg-gray-950 py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">

          {/* Property name as minimal wordmark */}
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/30 mb-8">
            {identity.name}
          </p>

          {/* Thin rule */}
          <div className="mx-auto mb-8 h-px w-16 bg-white/10" />

          {/* Contact links in a row */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                {contact.phone}
              </a>
            )}
            {contact.whatsapp && (
              <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                WhatsApp
              </a>
            )}
          </div>

          {/* Nav links */}
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#about" className="text-xs text-white/20 hover:text-white/50 transition-colors">About</a>
            <a href="#rooms" className="text-xs text-white/20 hover:text-white/50 transition-colors">Rooms</a>
            <a href="#gallery" className="text-xs text-white/20 hover:text-white/50 transition-colors">Gallery</a>
            <a href="#contact" className="text-xs text-white/20 hover:text-white/50 transition-colors">Contact</a>
          </div>

          {/* Copyright + legal */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-5 gap-y-1">
            <p className="text-[11px] text-white/15">&copy; {year} {identity.name}</p>
            <a href="/terms" className="text-[11px] text-white/15 hover:text-white/30 transition-colors">Terms</a>
            <a href="/privacy" className="text-[11px] text-white/15 hover:text-white/30 transition-colors">Privacy</a>
          </div>

        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-lg text-text">{identity.name}</h3>
            <p className="mt-2 text-sm text-text-muted">
              {identity.location}, {identity.country}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider text-text-muted">
              Quick Links
            </h4>
            <nav className="mt-3 flex flex-col gap-2">
              <a href="#about" className="text-sm text-text-secondary hover:text-primary transition-colors">
                About
              </a>
              <a href="#rooms" className="text-sm text-text-secondary hover:text-primary transition-colors">
                Rooms
              </a>
              <a href="#gallery" className="text-sm text-text-secondary hover:text-primary transition-colors">
                Gallery
              </a>
              <a href="#contact" className="text-sm text-text-secondary hover:text-primary transition-colors">
                Contact
              </a>
            </nav>
          </div>

          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider text-text-muted">
              Contact
            </h4>
            <div className="mt-3 flex flex-col gap-2">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="text-sm text-text-secondary hover:text-primary transition-colors">
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="text-sm text-text-secondary hover:text-primary transition-colors">
                  {contact.phone}
                </a>
              )}
              {contact.whatsapp && (
                <a
                  href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                  className="text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-text-muted">
          <span>&copy; {year} {identity.name}. All rights reserved.</span>
          <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
