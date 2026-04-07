"use client";

/**
 * /booking/success?id=BOOKING_ID&session_id=CHECKOUT_SESSION_ID
 *
 * Shown after a guest completes payment on the Stripe Checkout page.
 * Polls /api/bookings/[id]/status until confirmed, then redirects to the
 * full confirmation page.
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type PollState =
  | { phase: "polling"; attempt: number }
  | { phase: "confirmed"; code: string }
  | { phase: "authorized"; code: string }  // external mode: payment held, awaiting iCal revalidation
  | { phase: "timeout" }
  | { phase: "error"; message: string };

const MAX_ATTEMPTS = 15; // 15 × 2s = 30 seconds
const POLL_INTERVAL = 2000;

function SuccessContent() {
  const params = useSearchParams();
  const bookingId = params.get("id");

  const [state, setState] = useState<PollState>({ phase: "polling", attempt: 0 });

  useEffect(() => {
    if (!bookingId) {
      setState({ phase: "error", message: "No booking ID found in URL." });
      return;
    }

    let cancelled = false;
    let attempt = 0;

    async function poll() {
      if (cancelled) return;

      attempt++;
      setState({ phase: "polling", attempt });

      try {
        const res = await fetch(`/api/bookings/${bookingId}/status`);
        if (!res.ok) {
          if (res.status === 404) {
            setState({ phase: "error", message: "Booking not found." });
            return;
          }
          // Transient error — keep polling
        } else {
          const data = await res.json();

          if (data.status === "confirmed") {
            setState({ phase: "confirmed", code: data.confirmationCode });
            setTimeout(() => {
              if (!cancelled) window.location.href = `/booking/confirm/${bookingId}`;
            }, 1500);
            return;
          }

          // External mode: payment authorized, waiting for iCal revalidation.
          // This is a stable terminal state from the guest's perspective — stop polling.
          if (data.status === "payment_authorized") {
            setState({ phase: "authorized", code: data.confirmationCode });
            setTimeout(() => {
              if (!cancelled) window.location.href = `/booking/confirm/${bookingId}`;
            }, 3000);
            return;
          }

          if (data.status === "expired" || data.status === "cancelled" || data.status === "rejected") {
            const msg =
              data.status === "rejected"
                ? "Your requested dates are no longer available. No charge was made. Please start a new reservation."
                : data.status === "expired"
                ? "Your booking session expired before payment was completed. Please start a new reservation."
                : "Your booking has been cancelled. Please start a new reservation.";
            setState({ phase: "error", message: msg });
            return;
          }
        }
      } catch {
        // Network error — keep polling
      }

      if (attempt >= MAX_ATTEMPTS) {
        setState({ phase: "timeout" });
        return;
      }

      setTimeout(poll, POLL_INTERVAL);
    }

    const timer = setTimeout(poll, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bookingId]);

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">

      {state.phase === "polling" && (
        <>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment received!</h1>
          <p className="text-sm text-gray-500 mb-6">
            We&apos;re confirming your reservation&hellip;
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            Confirming your reservation…
          </div>
        </>
      )}

      {state.phase === "confirmed" && (
        <>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-sm text-gray-500 mb-4">Your reservation is confirmed.</p>
          <div className="inline-block rounded-xl bg-gray-900 px-8 py-4 mb-5">
            <p className="text-xs text-gray-400 mb-1 tracking-widest uppercase">Confirmation code</p>
            <p className="text-2xl font-bold text-white tracking-widest font-mono">{state.code}</p>
          </div>
          <p className="text-xs text-gray-400">Redirecting to your booking details…</p>
        </>
      )}

      {state.phase === "authorized" && (
        <>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Booking request received</h1>
          <p className="text-sm text-gray-500 mb-4">
            Your dates are reserved and your payment is on hold. We&apos;ll verify availability
            and confirm your stay within <strong>24 hours</strong>.
          </p>
          <div className="inline-block rounded-xl bg-gray-900 px-8 py-4 mb-5">
            <p className="text-xs text-gray-400 mb-1 tracking-widest uppercase">Booking reference</p>
            <p className="text-2xl font-bold text-white tracking-widest font-mono">{state.code}</p>
          </div>
          <p className="text-xs text-gray-400">Redirecting to your booking details…</p>
        </>
      )}

      {state.phase === "timeout" && (
        <>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment processing</h1>
          <p className="text-sm text-gray-500 mb-4">
            Your payment was received but confirmation is taking longer than expected.
            Your booking will be confirmed shortly — please check your email.
          </p>
          {bookingId && (
            <a
              href={`/booking/confirm/${bookingId}`}
              className="inline-block rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              View booking status →
            </a>
          )}
        </>
      )}

      {state.phase === "error" && (
        <>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-500 mb-4">{state.message}</p>
          <a
            href="/"
            className="inline-block rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Back to home
          </a>
        </>
      )}
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
      <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-gray-200" />
      <div className="mx-auto mb-3 h-5 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mx-auto h-4 w-56 animate-pulse rounded bg-gray-100" />
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Suspense fallback={<LoadingCard />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
