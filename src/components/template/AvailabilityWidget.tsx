"use client";

import { useState } from "react";
import type {
  BookingConfig,
  PriceLineItem,
  RoomUnit,
  BookingPrefill,
} from "@/lib/types";
import PriceBreakdown from "@/components/template/PriceBreakdown";

// ─── Local result shape (mirrors /api/availability response) ─────────────────

interface AvailabilityResult {
  room: RoomUnit;
  available: boolean;
  capacityExceeded: boolean;
  availableUnits: number;
  totalUnits: number;
  pricePerNight: number | null;
  avgPricePerNight: number | null;
  minStay: number;
  nights: number;
  totalPrice: number | null;
  priceBreakdown: PriceLineItem[];
}

interface Props {
  config: BookingConfig;
  onClose: () => void;
  /** When provided the widget skips search and opens directly on the booking form. */
  prefill?: BookingPrefill;
}

const todayStr = new Date().toISOString().split("T")[0];

const inp =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

function fmtDateShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Guests counter ───────────────────────────────────────────────────────────

function GuestsCounter({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Remove guest"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>
      <span className="w-6 text-center text-sm font-semibold text-gray-900">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        disabled={value >= 20}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Add guest"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

// ─── Search + Results step ────────────────────────────────────────────────────

function SearchStep({
  config,
  checkIn, setCheckIn,
  checkOut, setCheckOut,
  guests, setGuests,
  results, loading, error,
  onSearch, onBook,
}: {
  config: BookingConfig;
  checkIn: string; setCheckIn: (v: string) => void;
  checkOut: string; setCheckOut: (v: string) => void;
  guests: number; setGuests: (n: number) => void;
  results: AvailabilityResult[] | null;
  loading: boolean; error: string;
  onSearch: () => void;
  onBook: (r: AvailabilityResult) => void;
}) {
  const availableCount = results?.filter(r => r.available).length ?? 0;

  return (
    <>
      <div className="p-6">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Check Availability</h2>
        <p className="mb-5 text-sm text-gray-500">Select your dates to see available rooms and pricing.</p>

        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Check-in date</label>
            <input
              type="date"
              value={checkIn}
              min={todayStr}
              onChange={e => { setCheckIn(e.target.value); }}
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Check-out date</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || todayStr}
              onChange={e => { setCheckOut(e.target.value); }}
              className={inp}
            />
          </div>
        </div>

        {/* Guests row */}
        <div className="mb-4 flex items-center justify-between rounded-md border border-gray-300 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Guests</p>
            <p className="text-xs text-gray-400">Adults &amp; children</p>
          </div>
          <GuestsCounter value={guests} onChange={n => { setGuests(n); }} />
        </div>

        {error && (
          <p className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Checking…" : "Search Availability"}
        </button>

        {config.mode === "request_to_book" && (
          <p className="mt-2 text-center text-xs text-gray-400">
            No payment required to request — we&apos;ll review and confirm your dates first.
          </p>
        )}
      </div>

      {results && (
        <div className="border-t border-gray-100 px-6 pb-6">
          {availableCount === 0 ? (
            <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 px-4 py-5 text-center">
              <p className="text-sm font-medium text-gray-700">
                No rooms available for {guests} guest{guests !== 1 ? "s" : ""} on these dates
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Try different dates or a smaller group size, or contact us directly.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 mt-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {availableCount} room {availableCount === 1 ? "type" : "types"} available
              </p>
              <div className="space-y-3">
                {results.map((r) => {
                  const { room, available, capacityExceeded, availableUnits, totalUnits, avgPricePerNight, minStay, nights, totalPrice } = r;
                  const belowMinStay = available && nights < minStay;

                  const badgeLabel = capacityExceeded
                    ? `Too small for ${guests} guests`
                    : !available
                    ? "Unavailable"
                    : totalUnits > 1 && availableUnits === 1
                    ? "1 room left!"
                    : totalUnits > 1
                    ? `${availableUnits} rooms left`
                    : "Available";
                  const badgeClass = capacityExceeded
                    ? "bg-orange-100 text-orange-700"
                    : !available
                    ? "bg-gray-100 text-gray-500"
                    : availableUnits === 1 && totalUnits > 1
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800";

                  return (
                    <div
                      key={room.id}
                      className={`flex items-center gap-4 rounded-lg border p-4 ${
                        available && !belowMinStay
                          ? "border-gray-200 bg-white"
                          : "border-gray-200 bg-gray-50 opacity-70"
                      }`}
                    >
                      {room.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={room.image} alt={room.name} className="h-14 w-20 shrink-0 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{room.name}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                        </div>
                        {available && avgPricePerNight != null && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {config.currency} {avgPricePerNight.toLocaleString()}/night
                            {nights > 1 && totalPrice != null &&
                              ` · ${nights} nights · Total ${config.currency} ${totalPrice.toLocaleString()}`
                            }
                          </p>
                        )}
                        {belowMinStay && (
                          <p className="text-xs text-amber-700 mt-0.5">
                            Minimum stay is {minStay} nights for this room.
                          </p>
                        )}
                        {room.capacity != null && room.capacity > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Up to {room.capacity} guest{room.capacity !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      {available && !belowMinStay && totalPrice != null && (
                        <button
                          type="button"
                          onClick={() => onBook(r)}
                          className="shrink-0 rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ─── Booking form step ────────────────────────────────────────────────────────

function BookingStep({
  result, checkIn, checkOut, config, initialGuests, onBack,
}: {
  result: AvailabilityResult;
  checkIn: string; checkOut: string;
  config: BookingConfig;
  /** Pre-filled from the search step so the guest doesn't re-enter their group size. */
  initialGuests: number;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adults, setAdults] = useState(initialGuests);
  const [children, setChildren] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setError("");
    setSubmitting(true);

    try {
      const createRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: result.room.id,
          checkIn,
          checkOut,
          guest: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            adults,
            children,
            notes: notes.trim() || undefined,
          },
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        setError(createData.error || "Could not complete your request. Please try again.");
        setSubmitting(false);
        return;
      }

      if (createData.checkoutUrl) {
        // Instant Book — redirect to Stripe Checkout
        window.location.href = createData.checkoutUrl;
        return;
      }

      if (createData.type === "request") {
        // Request to Book — show confirmation screen
        setRequestSubmitted(true);
        setSubmitting(false);
        return;
      }

      setError("Something went wrong. Please contact the property directly.");
      setSubmitting(false);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  // Request submitted success screen
  if (requestSubmitted) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Request received!</h3>
        <p className="mb-1 text-sm text-gray-600">
          We&apos;ve received your request for <strong>{result.room.name}</strong>.
        </p>
        <p className="text-sm text-gray-500 leading-relaxed">
          You&apos;ll receive an email shortly confirming we got it. We&apos;ll be in touch to let you know if your dates are available. <strong>No payment has been taken.</strong>
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to results
      </button>

      {/* Booking summary card */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 flex gap-4">
        {result.room.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.room.image}
            alt={result.room.name}
            className="h-16 w-20 shrink-0 rounded-md object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{result.room.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {fmtDateShort(checkIn)} — {fmtDateShort(checkOut)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {result.nights} {result.nights === 1 ? "night" : "nights"}
          </p>
        </div>
      </div>

      {/* Price breakdown */}
      {result.priceBreakdown.length > 0 && result.totalPrice != null && (
        <div className="mb-6">
          <PriceBreakdown
            breakdown={result.priceBreakdown}
            totalPrice={result.totalPrice}
            currency={config.currency}
            nights={result.nights}
            compact
          />
        </div>
      )}

      {/* Guest form */}
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Your details</h3>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              required
              autoComplete="name"
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              required
              autoComplete="email"
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              autoComplete="tel"
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Adults</label>
            <input
              type="number"
              min={1}
              max={result.room.capacity || 10}
              value={adults}
              onChange={e => setAdults(Number(e.target.value))}
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Children <span className="text-gray-400 font-normal">(under 12)</span>
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={children}
              onChange={e => setChildren(Number(e.target.value))}
              className={inp}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Special requests <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Dietary needs, approximate arrival time, accessibility requirements…"
              className={inp + " resize-none"}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {config.mode === "request_to_book" ? (
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting
              ? "Sending request…"
              : `Send booking request · ${config.currency} ${result.totalPrice?.toLocaleString() ?? "—"}`}
          </button>
        ) : (
          <>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting
                ? "Redirecting to payment…"
                : `Continue to payment · ${config.currency} ${result.totalPrice?.toLocaleString() ?? "—"}`}
            </button>
            {/* Trust signals */}
            <div className="flex items-center justify-center gap-5 pt-1">
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure checkout
              </span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Powered by Stripe
              </span>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

type Step = "search" | "booking";

function prefillToResult(p: BookingPrefill): AvailabilityResult {
  return {
    room:             p.room,
    available:        true,
    availableUnits:   1,
    totalUnits:       1,
    pricePerNight:    p.avgPricePerNight,
    avgPricePerNight: p.avgPricePerNight,
    minStay:          p.minStay,
    nights:           p.nights,
    totalPrice:       p.totalPrice,
    priceBreakdown:   p.priceBreakdown,
  };
}

export default function AvailabilityWidget({ config, onClose, prefill }: Props) {
  const [step, setStep] = useState<Step>(prefill ? "booking" : "search");
  const [checkIn, setCheckIn] = useState(prefill?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(prefill?.checkOut ?? "");
  const [guests, setGuests] = useState(prefill ? (prefill.room.capacity ? Math.min(1, prefill.room.capacity) : 1) : 1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AvailabilityResult[] | null>(null);
  const [searchError, setSearchError] = useState("");
  const [selectedResult, setSelectedResult] = useState<AvailabilityResult | null>(
    prefill ? prefillToResult(prefill) : null
  );

  async function search() {
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      setSearchError("Please select a valid check-in and check-out date.");
      return;
    }
    setLoading(true);
    setSearchError("");
    setResults(null);
    try {
      const res = await fetch(
        `/api/availability?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
      );
      const data = await res.json();
      if (!res.ok) {
        setSearchError("Could not check availability. Please try again.");
        return;
      }
      setResults(data.results);
    } finally {
      setLoading(false);
    }
  }

  function handleBook(result: AvailabilityResult) {
    setSelectedResult(result);
    setStep("booking");
  }

  function handleBackFromBooking() {
    if (prefill) { onClose(); return; }
    setStep("search");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative z-10 w-full rounded-xl bg-white shadow-2xl overflow-y-auto max-h-[90vh] ${
          step === "search" ? "max-w-lg" : "max-w-xl"
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === "search" && (
          <SearchStep
            config={config}
            checkIn={checkIn}
            setCheckIn={v => { setCheckIn(v); setResults(null); setSearchError(""); }}
            checkOut={checkOut}
            setCheckOut={v => { setCheckOut(v); setResults(null); setSearchError(""); }}
            guests={guests}
            setGuests={n => { setGuests(n); setResults(null); }}
            results={results}
            loading={loading}
            error={searchError}
            onSearch={search}
            onBook={handleBook}
          />
        )}

        {step === "booking" && selectedResult && (
          <BookingStep
            result={selectedResult}
            checkIn={checkIn}
            checkOut={checkOut}
            config={config}
            initialGuests={guests}
            onBack={handleBackFromBooking}
          />
        )}
      </div>
    </div>
  );
}
