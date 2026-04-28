"use client";

import { useState, useEffect } from "react";
import type { HeroContent, BrandingConfig, BookingConfig, PropertyIdentity, Amenity, ContactInfo } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";
import AvailabilityWidget from "@/components/template/AvailabilityWidget";

interface HeroProps {
  content: HeroContent;
  branding: BrandingConfig;
  booking?: BookingConfig;
  layout?: LayoutPreset;
  /** Pass to generate eyebrow from property type + location */
  identity?: PropertyIdentity;
  /** Pass to render up to 3 trust badges */
  amenities?: Amenity[];
  /** Show booking bar pinned inside the bottom of the hero (default layout only) */
  showBookingBar?: boolean;
  /** Contact info for WhatsApp button in the booking bar */
  contact?: ContactInfo;
  /** Property name for the booking bar tagline */
  propertyName?: string;
  /** Custom background colour override for the booking bar (from sectionColors.bookingCta) */
  bookingBarBg?: string;
  /** Dark overlay on the hero image 0–80. Default layout only. Default: 30. */
  heroOverlayOpacity?: number;
}

interface InnerProps {
  content: HeroContent;
  booking?: BookingConfig;
  isInternal: boolean;
  onBook: () => void;
  identity?: PropertyIdentity;
  amenities?: Amenity[];
  showBookingBar?: boolean;
  contact?: ContactInfo;
  propertyName?: string;
  bookingBarBg?: string;
  heroOverlayOpacity?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  villa: "Villa",
  hostel: "Hostel",
  apartment: "Apartment",
  homestay: "Homestay",
  guesthouse: "Guesthouse",
};

function buildEyebrow(identity: PropertyIdentity | undefined, tagline: string): string {
  if (identity) {
    const type = TYPE_LABELS[identity.propertyType] ?? identity.propertyType;
    return `${type} · ${identity.location}`;
  }
  return tagline;
}

function getBadges(amenities: Amenity[] | undefined): string[] {
  return amenities?.slice(0, 3).map(a => a.label) ?? [];
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Hero({
  content,
  branding,
  booking,
  layout = "default",
  identity,
  amenities,
  showBookingBar,
  contact,
  propertyName,
  bookingBarBg,
  heroOverlayOpacity,
}: HeroProps) {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const hasBookingWidget = !!booking?.mode;

  const inner: InnerProps = {
    content,
    booking,
    identity,
    amenities,
    showBookingBar,
    contact,
    propertyName,
    bookingBarBg,
    heroOverlayOpacity,
    isInternal: hasBookingWidget,
    onBook: () => setWidgetOpen(true),
  };

  void branding;

  return (
    <>
      {layout === "editorial" && <HeroEditorial {...inner} />}
      {layout === "resort"    && <HeroResort    {...inner} />}
      {layout !== "editorial" && layout !== "resort" && <HeroDefault {...inner} />}

      {hasBookingWidget && widgetOpen && booking && (
        <AvailabilityWidget
          config={booking}
          onClose={() => setWidgetOpen(false)}
        />
      )}
    </>
  );
}

// ─── Default ─────────────────────────────────────────────────────────────────
// Full-bleed, centered.
// Structure: Eyebrow (top) → Title (center) → Subtitle → CTA (Explore only)
// Check Availability lives in the booking bar at the bottom.

function HeroDefault({ content, isInternal, onBook, identity, showBookingBar, contact, propertyName, bookingBarBg, booking, heroOverlayOpacity }: InnerProps) {
  const eyebrow = buildEyebrow(identity, content.tagline);
  const overlayAlpha = (heroOverlayOpacity ?? 30) / 100;

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden">

      {/* Background image + overlays */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={content.image} alt="" className="h-full w-full object-cover" fetchPriority="high" />
        {/* Adjustable solid overlay — controls uniform text legibility */}
        <div className="absolute inset-0 bg-black" style={{ opacity: overlayAlpha }} />
        {/* Gradient — anchors the bottom content and booking bar */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Content block — vertically centered, equal gaps between all three elements */}
      <div className="relative z-10 mx-auto w-[88%] max-w-[820px] text-center text-white">

        {/* Eyebrow — in flow so its gap to title matches title gap to subtitle */}
        {eyebrow && (
          <p className="mb-20 text-[10px] sm:text-[12px] font-semibold uppercase tracking-[0.3em] text-white/60 line-clamp-1"
             style={{ fontFamily: "var(--font-body)" }}>
            {eyebrow}
          </p>
        )}

        {/* Title — Playfair Display, clamp 42px→72px, tight line-height */}
        <h1 className="mb-28 text-[clamp(2.625rem,6vw,4.5rem)] font-normal leading-[0.97] tracking-[-0.01em]">
          {content.headline}
        </h1>

        {/* Subtitle — same style as eyebrow: uppercase, small, tracked */}
        <p className="mx-auto mb-10 w-full max-w-[800px] text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.22em] leading-[2] text-white/60 text-center"
           style={{ fontFamily: "var(--font-body)" }}>
          {content.intro}
        </p>

      </div>

      {/* Booking bar — pinned to bottom of hero, uses brand primary colour */}
      {showBookingBar && booking && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20 bg-primary border-t border-white/10"
          style={bookingBarBg ? { backgroundColor: bookingBarBg } : undefined}
        >
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row">
            <p
              className="text-sm font-medium text-white/75 tracking-wide"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {propertyName ? `Ready to experience ${propertyName}?` : "Ready to book?"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {isInternal
                ? <button
                    type="button"
                    onClick={onBook}
                    className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold rounded-full bg-white text-gray-900 hover:bg-white/90 transition-colors"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {booking.ctaLabel || "Check Availability"}
                  </button>
                : <a
                    href={content.primaryCTA.url}
                    className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold rounded-full bg-white text-gray-900 hover:bg-white/90 transition-colors"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {booking.ctaLabel || "Check Availability"}
                  </a>
              }
              {contact?.whatsapp && (
                <a
                  href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                  className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded-full border border-white/50 text-white hover:bg-white/10 transition-colors"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scroll arrow — sits just above the booking bar (or bottom of hero if no bar) */}
      <a
        href="#about"
        aria-label="Scroll down"
        className={`absolute left-1/2 -translate-x-1/2 z-10 animate-bounce text-white/40 hover:text-white/70 transition-colors ${showBookingBar ? "bottom-[108px] sm:bottom-[92px]" : "bottom-10"}`}
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 9l-7 7-7-7" />
        </svg>
      </a>

    </section>
  );
}

// ─── Editorial ────────────────────────────────────────────────────────────────
// White panel (left 44%) + full-height image (right 56%).
// Structure: eyebrow (absolute top) → rule → Title → Subtitle → Badges → CTAs

function HeroEditorial({ content, isInternal, onBook, identity, amenities }: InnerProps) {
  const [visible, setVisible] = useState(false);
  const eyebrow = buildEyebrow(identity, content.tagline);
  const badges  = getBadges(amenities);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const primaryCls = "inline-flex items-center justify-center px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-all duration-200 rounded-full bg-gray-900 text-white hover:bg-gray-700";

  return (
    <section className="flex min-h-screen flex-col lg:flex-row overflow-hidden">

      {/* Image — top on mobile, right on desktop */}
      <div className="order-1 lg:order-2 relative min-h-[65vw] flex-1 overflow-hidden lg:min-h-screen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={content.image} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-black/8" />
      </div>

      {/* White type panel — below image on mobile, left on desktop */}
      <div className="order-2 lg:order-1 relative flex flex-col justify-center lg:w-[44%] bg-white px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-0 lg:min-h-screen">

        {/* Eyebrow — absolute at top of panel */}
        <div className="absolute top-8 left-6 sm:left-10 lg:top-12 lg:left-16 right-6 sm:right-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-gray-300 truncate">
            {eyebrow}
          </p>
        </div>

        <div>
          {/* Brand rule */}
          <div className={`mb-8 h-px w-12 bg-primary transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`} />

          {/* Title */}
          <h1 className={`mb-7 text-4xl font-light leading-[1.03] tracking-tight text-gray-900 sm:text-5xl xl:text-[5.25rem] transition-all duration-1000 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            {content.headline}
          </h1>

          {/* Subtitle — Inter, no italic */}
          <p
            className={`mb-7 text-base leading-relaxed text-gray-500 max-w-sm lg:max-w-xs transition-all duration-700 delay-200 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            {content.intro}
          </p>

          {/* Badges */}
          {badges.length > 0 && (
            <div className={`mb-8 flex flex-wrap gap-x-1 gap-y-2 transition-all duration-700 delay-[300ms] ease-out ${visible ? "opacity-100" : "opacity-0"}`}>
              {badges.map((badge, i) => (
                <span
                  key={i}
                  className="flex items-center text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-300"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {i > 0 && <span className="mx-2.5 text-gray-200">·</span>}
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className={`flex flex-wrap items-center gap-5 transition-all duration-700 delay-[350ms] ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            {isInternal
              ? <button type="button" onClick={onBook} className={primaryCls}>{content.primaryCTA.label}</button>
              : <a href={content.primaryCTA.url} className={primaryCls}>{content.primaryCTA.label}</a>}
            {content.secondaryCTA.label && (
              <a
                href={content.secondaryCTA.url}
                className="group flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors duration-200"
              >
                {content.secondaryCTA.label}
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </a>
            )}
          </div>
        </div>

        {/* Scroll indicator — desktop only */}
        <div className={`hidden lg:flex absolute bottom-8 left-10 lg:left-16 items-center gap-3 transition-all duration-700 delay-700 ease-out ${visible ? "opacity-100" : "opacity-0"}`}>
          <div className="h-px w-8 bg-gray-300" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-gray-400">Scroll</span>
        </div>

      </div>
    </section>
  );
}

// ─── Resort ───────────────────────────────────────────────────────────────────
// Cinematic full-viewport. Bottom-left anchor. Ken Burns zoom.
// Structure: Eyebrow → Title → Subtitle → Badges → CTAs (pill)

function HeroResort({ content, isInternal, onBook, identity, amenities }: InnerProps) {
  const [imgStarted, setImgStarted] = useState(false);
  const [textIn, setTextIn] = useState(false);
  const eyebrow = buildEyebrow(identity, content.tagline);
  const badges  = getBadges(amenities);

  useEffect(() => {
    const t1 = setTimeout(() => setImgStarted(true), 80);
    const t2 = setTimeout(() => setTextIn(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const primaryCls   = "inline-flex items-center justify-center px-8 py-4 text-sm font-semibold tracking-[0.15em] uppercase transition-all duration-300 rounded-full bg-white text-gray-900 hover:bg-white/90 shadow-lg";
  const secondaryCls = "inline-flex items-center justify-center px-8 py-4 text-sm font-medium tracking-[0.15em] uppercase transition-all duration-300 rounded-full border border-white/40 text-white hover:bg-white/10 hover:border-white/70";

  return (
    <section className="relative h-screen min-h-[680px] flex flex-col justify-end overflow-hidden">

      {/* Ken Burns zoom */}
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content.image}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover will-change-transform
            transition-transform ease-[cubic-bezier(0.16,1,0.3,1)] duration-[20000ms]
            ${imgStarted ? "scale-100" : "scale-[1.08]"}`}
          fetchPriority="high"
        />
      </div>

      {/* Gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />

      {/* Text block — bottom-left anchored */}
      <div
        className={`relative z-10 px-6 sm:px-10 md:px-16 lg:px-20 pb-16 sm:pb-20 md:pb-28 max-w-4xl
          transition-all duration-1000 ease-out
          ${textIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {/* Eyebrow */}
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.5em] text-white/50"
           style={{ fontFamily: "var(--font-body)" }}>
          {eyebrow}
        </p>

        {/* Title */}
        <h1 className="mb-8 text-5xl font-light leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl max-w-3xl">
          {content.headline}
        </h1>

        {/* Subtitle — Inter, no italic */}
        <p className="mb-8 text-base sm:text-lg font-normal leading-relaxed text-white/70 max-w-md"
           style={{ fontFamily: "var(--font-body)" }}>
          {content.intro}
        </p>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-y-2">
            {badges.map((badge, i) => (
              <span
                key={i}
                className="flex items-center text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-white/40"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {i > 0 && <span className="mx-3 opacity-50">·</span>}
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-4">
          {isInternal
            ? <button type="button" onClick={onBook} className={primaryCls}>{content.primaryCTA.label}</button>
            : <a href={content.primaryCTA.url} className={primaryCls}>{content.primaryCTA.label}</a>}
          {content.secondaryCTA.label && (
            <a href={content.secondaryCTA.url} className={secondaryCls}>{content.secondaryCTA.label}</a>
          )}
        </div>
      </div>

      {/* Scroll indicator — bottom-right, vertical */}
      <div
        className={`absolute bottom-8 right-8 sm:right-12 md:right-16 lg:right-20 flex flex-col items-center gap-3
          transition-all duration-700 delay-[1200ms] ease-out
          ${textIn ? "opacity-100" : "opacity-0"}`}
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.4em] text-white/30 [writing-mode:vertical-rl]">
          Scroll
        </span>
        <div className="h-12 w-px bg-gradient-to-b from-white/0 to-white/35" />
      </div>

    </section>
  );
}
