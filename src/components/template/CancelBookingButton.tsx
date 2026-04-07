"use client";

import { useState } from "react";

interface CancelBookingButtonProps {
  bookingId: string;
  onCancelled?: () => void;
}

/**
 * Self-service cancellation button for the guest confirmation page.
 *
 * Shows a confirmation dialog before sending the cancellation request.
 * On success, reloads the page so the cancelled status banner appears.
 */
export default function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
  const [step, setStep] = useState<"idle" | "confirming" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function doCancel() {
    setStep("loading");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by guest" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Cancellation failed");
      }
      // Reload so the cancelled banner is shown
      window.location.reload();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred");
      setStep("error");
    }
  }

  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("confirming")}
        className="text-sm text-gray-400 underline hover:text-red-600 transition-colors"
      >
        Cancel this reservation
      </button>
    );
  }

  if (step === "confirming") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm">
        <p className="font-semibold text-red-900 mb-1">Cancel your reservation?</p>
        <p className="text-red-700 mb-4 text-xs leading-relaxed">
          This cannot be undone. If you paid online, any refund will be processed per the cancellation policy and
          may take 5–10 business days to appear on your statement.
        </p>
        <div className="flex gap-3">
          <button
            onClick={doCancel}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Yes, cancel reservation
          </button>
          <button
            onClick={() => setStep("idle")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Keep reservation
          </button>
        </div>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <p className="text-sm text-gray-500 animate-pulse">Cancelling reservation…</p>
    );
  }

  // error
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
      <p className="text-red-700">{errorMsg}</p>
      <button
        onClick={() => setStep("idle")}
        className="mt-2 text-xs text-red-600 underline"
      >
        Try again
      </button>
    </div>
  );
}
