"use client";

import { useState } from "react";
import SectionWrapper from "@/components/template/ui/SectionWrapper";
import RoomModal from "@/components/template/RoomModal";
import AvailabilityWidget from "@/components/template/AvailabilityWidget";
import type { RoomUnit, BookingConfig, BookingPrefill, ContactInfo } from "@/lib/types";
import type { LayoutPreset } from "@/lib/layout";

interface RoomsProps {
  rooms: RoomUnit[];
  propertyType: string;
  booking?: BookingConfig;
  contact?: ContactInfo;
  layout?: LayoutPreset;
  bgColor?: string;
}

export default function Rooms({ rooms, propertyType, booking, contact, layout = "default", bgColor }: RoomsProps) {
  const sectionTitle = propertyType === "hostel" ? "Room Types" : "Accommodation";
  const sorted = [...rooms].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const [selected, setSelected] = useState<RoomUnit | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [widgetPrefill, setWidgetPrefill] = useState<BookingPrefill | undefined>(undefined);

  // Both instant_book and request_to_book use the availability widget
  const isInternal = !!booking?.mode;

  function handleCalendarBook(prefill: BookingPrefill) {
    setSelected(null);
    setWidgetPrefill(prefill);
    setWidgetOpen(true);
  }

  function closeWidget() {
    setWidgetOpen(false);
    setWidgetPrefill(undefined);
  }

  const modals = (
    <>
      {selected && (
        <RoomModal
          room={selected}
          onClose={() => setSelected(null)}
          showCalendar={isInternal}
          onBookFromCalendar={isInternal ? handleCalendarBook : undefined}
          externalBooking={undefined}
        />
      )}
      {widgetOpen && booking && (
        <AvailabilityWidget
          config={booking}
          onClose={closeWidget}
          prefill={widgetPrefill}
        />
      )}
    </>
  );

  // ─── Editorial: 2-column grid, 16:9 images, text-forward ────────────────────
  if (layout === "editorial") {
    return (
      <SectionWrapper id="rooms" background="surface" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 border-l-4 border-primary pl-7">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/70">
              {sectionTitle}
            </p>
            <h2 className="text-4xl font-light text-text sm:text-5xl">Where You&apos;ll Stay</h2>
          </div>

          <div className="grid gap-10 md:grid-cols-2">
            {sorted.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelected(room)}
                className="group text-left w-full"
              >
                <div className="relative aspect-video overflow-hidden rounded-sm mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={room.image}
                    alt={room.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {room.isFeatured && (
                    <span className="absolute top-3 left-3 rounded-sm bg-amber-400 px-2.5 py-0.5 text-[10px] font-semibold text-amber-900 uppercase tracking-wide">
                      Featured
                    </span>
                  )}
                </div>

                <div>
                  {room.shortDescription && (
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      {room.shortDescription}
                    </p>
                  )}
                  <h3 className="mb-2 text-xl font-light text-text group-hover:text-primary transition-colors">
                    {room.name}
                  </h3>
                  <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                    {room.capacity > 0 && <span>Up to {room.capacity} guests</span>}
                    {room.bedType && <span>· {room.bedType}</span>}
                    {room.size && <span>· {room.size}</span>}
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary line-clamp-2">
                    {room.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    {room.priceFrom && (
                      <p className="text-sm font-semibold text-primary">
                        From {room.priceFrom}
                        <span className="text-xs font-normal text-text-muted"> / night</span>
                      </p>
                    )}
                    <span className="text-xs text-primary/60 group-hover:text-primary transition-colors">
                      View details →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {modals}
      </SectionWrapper>
    );
  }

  // ─── Resort: full-bleed dark section, horizontal cards with image-left ──────
  // Dark background throughout — no white island in the middle of the page.
  // Cards use a near-black surface with a subtle border rather than white boxes.
  // Image panel takes 45% on desktop. Hover: image scales, card border brightens.
  // Each card stagger-reveals from below as it enters the viewport.
  if (layout === "resort") {
    return (
      <section id="rooms" className="bg-gray-950 py-24 md:py-32 px-4" style={bgColor ? { backgroundColor: bgColor } : undefined}>
        <div className="mx-auto max-w-5xl">

          {/* Section header */}
          <div className="mb-14 text-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-white/30">
              {sectionTitle}
            </p>
            <h2 className="text-3xl font-light text-white sm:text-4xl lg:text-5xl">
              Where You&apos;ll Stay
            </h2>
          </div>

          {/* Horizontal room cards */}
          <div className="space-y-5">
            {sorted.map((room, idx) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelected(room)}
                className="group flex w-full overflow-hidden rounded-lg border border-white/8 bg-white/4 text-left transition-all duration-300 hover:border-white/18 hover:bg-white/7"
              >
                {/* Image panel — 45% on desktop, full-width stacked on mobile */}
                <div className="relative hidden sm:block w-[45%] flex-shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={room.image}
                    alt={room.name}
                    loading={idx < 2 ? "eager" : "lazy"}
                    className="h-full w-full object-cover min-h-[240px] transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {/* Subtle right-side vignette — blends image into dark card */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/30" />
                  {room.isFeatured && (
                    <span className="absolute top-4 left-4 rounded-sm bg-amber-400/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
                      Featured
                    </span>
                  )}
                </div>

                {/* Mobile: stacked image */}
                <div className="relative block sm:hidden w-full overflow-hidden">
                  <div className="aspect-[16/9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={room.image}
                      alt={room.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                {/* Content panel */}
                <div className="flex flex-col justify-center px-7 py-8 flex-1">
                  {room.shortDescription && (
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
                      {room.shortDescription}
                    </p>
                  )}
                  <h3 className="mb-3 text-xl font-light text-white sm:text-2xl">
                    {room.name}
                  </h3>
                  <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/35">
                    {room.capacity > 0 && <span>Up to {room.capacity} guests</span>}
                    {room.bedType && <span>· {room.bedType}</span>}
                    {room.size && <span>· {room.size}</span>}
                  </div>
                  <p className="text-sm leading-relaxed text-white/50 line-clamp-2 mb-5">
                    {room.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {room.priceFrom ? (
                      <p className="text-sm font-light text-white/70">
                        From <span className="font-medium text-white/90">{room.priceFrom}</span>
                        <span className="text-xs text-white/35"> / night</span>
                      </p>
                    ) : <span />}
                    <span className="text-xs tracking-[0.15em] uppercase text-white/30 group-hover:text-white/60 transition-colors">
                      View →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

        </div>
        {modals}
      </section>
    );
  }

  // ─── Default: 3-column card grid ─────────────────────────────────────────
  return (
    <SectionWrapper id="rooms" background="white" style={bgColor ? { backgroundColor: bgColor } : undefined}>
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          {sectionTitle}
        </p>
        <h2 className="text-3xl sm:text-4xl text-text">Where You&apos;ll Stay</h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => setSelected(room)}
            className="group overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-shadow hover:shadow-md text-left w-full"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={room.image}
                alt={room.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {room.isFeatured && (
                <span className="absolute top-3 right-3 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-semibold text-amber-900">
                  Featured
                </span>
              )}
              {room.gallery && room.gallery.length > 0 && (
                <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {room.gallery.length + 1}
                </span>
              )}
            </div>
            <div className="p-5">
              <h3 className="mb-1 text-lg font-semibold text-text">{room.name}</h3>
              {room.shortDescription && (
                <p className="mb-2 text-sm text-primary font-medium">{room.shortDescription}</p>
              )}
              <div className="mb-3 flex flex-wrap gap-2 text-xs text-text-muted">
                {room.capacity > 0 && <span>Up to {room.capacity} guests</span>}
                {room.bedType && <span>· {room.bedType}</span>}
                {room.size && <span>· {room.size}</span>}
              </div>
              {room.priceFrom && (
                <p className="text-base font-semibold text-primary">
                  From {room.priceFrom}
                  <span className="text-xs font-normal text-text-muted"> / night</span>
                </p>
              )}
              <p className="mt-2 text-xs text-primary/70 font-medium group-hover:text-primary transition-colors">
                View details →
              </p>
            </div>
          </button>
        ))}
      </div>

      {modals}
    </SectionWrapper>
  );
}
