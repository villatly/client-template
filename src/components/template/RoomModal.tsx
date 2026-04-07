"use client";

import { useEffect, useState, useCallback } from "react";
import type { RoomUnit, BookingPrefill } from "@/lib/types";
import RoomCalendar from "@/components/template/RoomCalendar";

interface RoomModalProps {
  room: RoomUnit;
  onClose: () => void;
  showCalendar?: boolean;
  /** Called when guest selects dates in the calendar and clicks "Book" */
  onBookFromCalendar?: (prefill: BookingPrefill) => void;
  /** External booking mode: link + label to show as the booking CTA */
  externalBooking?: { url: string; label: string };
}

export default function RoomModal({ room, onClose, showCalendar, onBookFromCalendar, externalBooking }: RoomModalProps) {
  const allImages = [
    ...(room.image ? [{ url: room.image, alt: room.name }] : []),
    ...(room.gallery ?? []),
  ];
  const [current, setCurrent] = useState(0);
  const [tab, setTab] = useState<"details" | "availability">("details");

  const prev = useCallback(() => setCurrent((c) => (c - 1 + allImages.length) % allImages.length), [allImages.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % allImages.length), [allImages.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (tab === "details") {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next, tab]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-black/30 p-1.5 text-white hover:bg-black/50 transition-colors"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image carousel */}
        {allImages.length > 0 && (
          <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden rounded-t-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current}
              src={allImages[current].url}
              alt={allImages[current].alt}
              className="h-full w-full object-cover"
            />

            {allImages.length > 1 && (
              <>
                <button onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50 transition-colors"
                  aria-label="Previous image">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50 transition-colors"
                  aria-label="Next image">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                      className={`h-1.5 rounded-full transition-all ${i === current ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
                      aria-label={`Image ${i + 1}`} />
                  ))}
                </div>

                <div className="absolute bottom-0 left-0 right-0 flex gap-1 overflow-x-auto px-3 pb-8 pt-2 [scrollbar-width:none]">
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                      className={`shrink-0 h-10 w-14 overflow-hidden rounded border-2 transition-all ${i === current ? "border-white" : "border-transparent opacity-60"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        {showCalendar && (
          <div className="flex border-b border-gray-200 px-6 pt-4">
            <button
              onClick={() => setTab("details")}
              className={`mr-4 pb-2 text-sm font-medium border-b-2 transition-colors ${tab === "details" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}
            >
              Details
            </button>
            <button
              onClick={() => setTab("availability")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${tab === "availability" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Availability
            </button>
          </div>
        )}

        {/* Details tab */}
        {tab === "details" && (
          <div className="p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold text-gray-900">{room.name}</h2>
                  {room.isFeatured && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Featured</span>
                  )}
                </div>
                {room.shortDescription && (
                  <p className="text-sm text-gray-500">{room.shortDescription}</p>
                )}
              </div>
              {room.priceFrom && (
                <div className="shrink-0 text-right">
                  <p className="text-xl font-semibold text-primary">{room.priceFrom}</p>
                  <p className="text-xs text-gray-400">per night</p>
                </div>
              )}
            </div>

            <div className="mb-4 flex flex-wrap gap-2 text-xs text-gray-600">
              {room.capacity > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Up to {room.capacity} guests
                </span>
              )}
              {room.bedType && <span className="rounded-full bg-gray-100 px-3 py-1">{room.bedType}</span>}
              {room.bathroomType && <span className="rounded-full bg-gray-100 px-3 py-1">{room.bathroomType}</span>}
              {room.size && <span className="rounded-full bg-gray-100 px-3 py-1">{room.size}</span>}
            </div>

            <p className="mb-5 text-sm leading-relaxed text-gray-600">{room.description}</p>

            {room.highlights && room.highlights.length > 0 && (
              <div className="mb-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Highlights</h3>
                <div className="flex flex-wrap gap-2">
                  {room.highlights.map((h, i) => (
                    <span key={i} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary font-medium">{h}</span>
                  ))}
                </div>
              </div>
            )}

            {room.amenities && room.amenities.length > 0 && (
              <div className="mb-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">In This Room</h3>
                <ul className="grid grid-cols-2 gap-1">
                  {room.amenities.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-primary">✓</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {/* External booking CTA (external mode) */}
              {externalBooking && (
                <a
                  href={externalBooking.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  {externalBooking.label}
                  <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {/* Room-specific CTA (optional, any mode) */}
              {!externalBooking && room.ctaLabel && room.ctaUrl && (
                <a href={room.ctaUrl}
                  className="inline-block rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
                  {room.ctaLabel}
                </a>
              )}
              {showCalendar && (
                <button onClick={() => setTab("availability")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  View Availability
                </button>
              )}
            </div>
          </div>
        )}

        {/* Availability tab */}
        {tab === "availability" && showCalendar && (
          <div className="p-6">
            <h2 className="mb-1 text-base font-semibold text-gray-900">Availability — {room.name}</h2>
            <p className="mb-5 text-xs text-gray-400">
              {onBookFromCalendar
                ? "Click a check-in date, then a check-out date to start a reservation."
                : "Green dates are available. Red dates are already booked or blocked."}
            </p>
            <RoomCalendar
              roomId={room.id}
              room={room}
              onBook={onBookFromCalendar}
            />
          </div>
        )}
      </div>
    </div>
  );
}
