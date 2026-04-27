"use client";

import { useState, useEffect } from "react";
import type { HeroContent, BrandingConfig, BookingConfig } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";
import { getButtonClass } from "@/lib/theme";
import AvailabilityWidget from "@/components/template/AvailabilityWidget";

interface HeroProps {
  content: HeroContent;
  branding: BrandingConfig;
  booking?: BookingConfig;
  layout?: LayoutPreset;
}

interface InnerProps {
  content: HeroContent;
  booking?: BookingConfig;
  isInternal: boolean;
  radius: string;
  onBook: () => void;
}

export default function Hero({
  content,
  branding,
  booking,
  layout = "default",
}: HeroProps) {
  const [widgetOpen, setWidgetOpen] = useState(false);
  // Both instant_book and request_to_book open the availability widget
  const hasBookingWidget = !!booking?.mode;
  const radius = getButtonClass(branding.buttonStyle);

  const inner: InnerProps = {
    content,
    booking,
    isInternal: hasBookingWidget,
    radius,
    onBook: () => setWidgetOpen(true),
  };

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
// Full-bleed, centered. Clean and safe.

function HeroDefault({ content, isInternal, radius, onBook }: InnerProps) {
  const primaryCls = `inline-flex items-center justify-center px-6 py-3 text-sm font-medium tracking-wide uppercase transition-all duration-200 ${radius} bg-white text-gray-900 hover:bg-white/90 shadow-sm`;
  const secondaryCls = `inline-flex items-center justify-center px-6 py-3 text-sm font-medium tracking-wide uppercase transition-all duration-200 ${radius} border-2 border-white text-white hover:bg-white hover:text-gray-900`;

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={content.image} alt="" className="h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/55" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center text-white">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 line-clamp-1">
          {content.tagline}
        </p>
        <h1 className="mb-6 text-4xl font-normal sm:text-5xl md:text-6xl lg:text-6xl leading-tight">
          {content.headline}
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-white/80 leading-loose text-center">
          {content.intro}
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {isInternal
            ? <button type="button" onClick={onBook} className={primaryCls}>{content.primaryCTA.label}</button>
            : <a href={content.primaryCTA.url} className={primaryCls}>{content.primaryCTA.label}</a>}
          {content.secondaryCTA.label && (
            <a href={content.secondaryCTA.url} className={secondaryCls}>{content.secondaryCTA.label}</a>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}

// ─── Editorial ────────────────────────────────────────────────────────────────
// White typography panel (left 44%) + raw full-height image (right 56%).
// The white panel is the design statement — no dark tones compete with it here,
// making the contrast break in Amenities (dark) much more effective later.
// Staggered entrance: rule → headline → intro → CTAs.

function HeroEditorial({ content, isInternal, radius, onBook }: InnerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const primaryCls = `inline-flex items-center justify-center px-6 py-3 text-sm font-medium tracking-wide uppercase transition-all duration-200 ${radius} bg-gray-900 text-white hover:bg-gray-700`;

  return (
    <section className="flex min-h-screen flex-col lg:flex-row overflow-hidden">

      {/* Image — first on mobile (top), right on desktop */}
      <div className="order-1 lg:order-2 relative min-h-[65vw] flex-1 overflow-hidden lg:min-h-screen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        {/* Very light vignette — let the photo breathe */}
        <div className="absolute inset-0 bg-black/8" />
      </div>

      {/* White type panel — second on mobile (below), left on desktop */}
      <div className="order-2 lg:order-1 relative flex flex-col justify-center lg:w-[44%] bg-white px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-0 lg:min-h-screen">

        {/* Masthead tagline — absolute at top */}
        <div className="absolute top-8 left-6 sm:left-10 lg:top-12 lg:left-16 right-6 sm:right-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-gray-300 truncate">
            {content.tagline}
          </p>
        </div>

        <div>
          {/* Thin primary rule — the only brand-color element on this panel */}
          <div
            className={`mb-8 h-px w-12 bg-primary transition-all duration-700 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            }`}
          />

          {/* Headline — large, tight, commanding */}
          <h1
            className={`mb-8 text-4xl font-light leading-[1.03] tracking-tight text-gray-900 sm:text-5xl xl:text-[5.25rem] transition-all duration-1000 ease-out ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            }`}
          >
            {content.headline}
          </h1>

          {/* Intro */}
          <p
            className={`mb-10 text-base leading-relaxed text-gray-500 max-w-sm lg:max-w-xs transition-all duration-700 delay-200 ease-out ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            {content.intro}
          </p>

          {/* CTAs */}
          <div
            className={`flex flex-wrap items-center gap-5 transition-all duration-700 delay-[350ms] ease-out ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
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

        {/* Scroll indicator — hidden on mobile to avoid overlap with short panel */}
        <div
          className={`hidden lg:flex absolute bottom-8 left-10 lg:left-16 items-center gap-3 transition-all duration-700 delay-700 ease-out ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="h-px w-8 bg-gray-300" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-gray-400">Scroll</span>
        </div>

      </div>
    </section>
  );
}

// ─── Resort ───────────────────────────────────────────────────────────────────
// Cinematic. Full viewport. The image is the world.
//
// What makes it feel premium:
//  - Bottom-LEFT text anchor, not centered — luxury hotel typography convention
//  - Headline at 8xl — visually dominates the frame
//  - Two-layer gradient: heavy bottom-to-top + left side pull for text legibility
//  - Solid-fill white CTA: confident and readable, not a ghost button
//  - Intro text is present and readable, not hidden behind low opacity
//  - Slow Ken Burns zoom: 20s ease-in-slow-out
//  - Vertical "Scroll" label at bottom right — cinematic touch
//  - Content enters 600ms after zoom starts — feels directed

function HeroResort({ content, isInternal, radius, onBook }: InnerProps) {
  const [imgStarted, setImgStarted] = useState(false);
  const [textIn, setTextIn] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setImgStarted(true), 80);
    const t2 = setTimeout(() => setTextIn(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Solid white — the single most confident CTA treatment on a dark image
  const primaryCls = `inline-flex items-center justify-center px-8 py-4 text-sm font-semibold tracking-[0.15em] uppercase transition-all duration-300 ${radius} bg-white text-gray-900 hover:bg-white/90 shadow-lg`;
  // Ghost secondary — deferential to primary
  const secondaryCls = `inline-flex items-center justify-center px-8 py-4 text-sm font-medium tracking-[0.15em] uppercase transition-all duration-300 ${radius} border border-white/40 text-white hover:bg-white/10 hover:border-white/70`;

  return (
    <section className="relative h-screen min-h-[680px] flex flex-col justify-end overflow-hidden">

      {/* Slow Ken Burns zoom — starts slightly zoomed, pulls back over 20s */}
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

      {/* Gradient layer 1: heavy bottom-to-top for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      {/* Gradient layer 2: left-side pull that follows the text block */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />

      {/* Text block — bottom-left anchored, generous size, left-aligned */}
      <div
        className={`relative z-10 px-6 sm:px-10 md:px-16 lg:px-20 pb-16 sm:pb-20 md:pb-28 max-w-4xl
          transition-all duration-1000 ease-out
          ${textIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {/* Eyebrow — spaced, visible but secondary */}
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.5em] text-white/50">
          {content.tagline}
        </p>

        {/* Headline — the dominant visual element */}
        <h1 className="mb-8 text-5xl font-light leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl max-w-3xl">
          {content.headline}
        </h1>

        {/* Intro — readable, not hidden */}
        <p className="mb-10 text-base sm:text-lg font-light leading-relaxed text-white/65 max-w-md">
          {content.intro}
        </p>

        {/* CTAs — solid primary, ghost secondary */}
        <div className="flex flex-wrap items-center gap-4">
          {isInternal
            ? <button type="button" onClick={onBook} className={primaryCls}>{content.primaryCTA.label}</button>
            : <a href={content.primaryCTA.url} className={primaryCls}>{content.primaryCTA.label}</a>}
          {content.secondaryCTA.label && (
            <a href={content.secondaryCTA.url} className={secondaryCls}>
              {content.secondaryCTA.label}
            </a>
          )}
        </div>
      </div>

      {/* Scroll indicator — vertical text + line, bottom-right */}
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
