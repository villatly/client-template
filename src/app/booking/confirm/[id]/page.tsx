import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/bookings";
import { getConfig, getContent } from "@/lib/property";
import PriceBreakdown from "@/components/template/PriceBreakdown";
import CancelBookingButton from "@/components/template/CancelBookingButton";

export const dynamic = "force-dynamic";

function fmtDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Status-specific banners ──────────────────────────────────────────────────

type BannerProps = {
  status: string;
  confirmationCode: string;
  adminEmail?: string;
  cancellationReason?: string;
};

function StatusBanner({ status, confirmationCode, adminEmail, cancellationReason }: BannerProps) {
  if (status === "confirmed" || status === "completed") {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 mb-8 flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">
          ✓
        </div>
        <div>
          <p className="font-semibold text-emerald-900">
            {status === "completed" ? "Stay completed" : "Reservation confirmed"}
          </p>
          <p className="text-sm text-emerald-700 mt-0.5">
            {status === "completed"
              ? "Thank you for staying with us."
              : "Your booking is confirmed. A confirmation has been sent to your email."}
          </p>
          {adminEmail && status === "confirmed" && (
            <p className="text-xs text-emerald-600 mt-1">
              Questions?{" "}
              <a href={`mailto:${adminEmail}`} className="underline hover:text-emerald-800">
                Email us at {adminEmail}
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (status === "pending_confirmation") {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 mb-8 flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white text-sm font-bold">
          ⏳
        </div>
        <div>
          <p className="font-semibold text-amber-900">Pending review</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Your request has been received. We&apos;ll review it and confirm shortly.
          </p>
          {adminEmail && (
            <p className="text-xs text-amber-600 mt-1">
              Have questions?{" "}
              <a href={`mailto:${adminEmail}`} className="underline hover:text-amber-800">
                Contact us
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (status === "pending_payment") {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 mb-8 flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white text-sm font-bold">
          💳
        </div>
        <div>
          <p className="font-semibold text-amber-900">Awaiting payment</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Your booking is waiting for payment to be completed. Refresh this page after paying to see your updated status.
          </p>
        </div>
      </div>
    );
  }

  if (status === "payment_authorized") {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 mb-8 flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white text-sm font-bold">
          ⏳
        </div>
        <div>
          <p className="font-semibold text-amber-900">Payment authorized — pending confirmation</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Your payment is held and your dates are reserved. We&apos;re verifying availability
            across all booking platforms and will confirm your stay within <strong>24 hours</strong>.
            You will receive a confirmation email once verified. If more than 24 hours have passed,
            please contact us — we&apos;ll resolve this for you immediately.
          </p>
          {adminEmail && (
            <p className="text-xs text-amber-600 mt-1">
              Questions?{" "}
              <a href={`mailto:${adminEmail}`} className="underline hover:text-amber-800">
                Contact us at {adminEmail}
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (status === "payment_failed") {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 mb-8 flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white text-sm font-bold">
          ✗
        </div>
        <div>
          <p className="font-semibold text-red-900">Payment failed</p>
          <p className="text-sm text-red-700 mt-0.5">
            Your payment was not processed. No charge was made to your card.
          </p>
          {adminEmail && (
            <p className="text-xs text-red-600 mt-1">
              Please{" "}
              <a href={`mailto:${adminEmail}`} className="underline hover:text-red-800">
                contact us
              </a>{" "}
              to retry or arrange an alternative.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    const isExpiry = cancellationReason?.toLowerCase().includes("expired");
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 mb-8 flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white text-sm font-bold">
          ✗
        </div>
        <div>
          <p className="font-semibold text-red-900">Booking unavailable — no charge made</p>
          <p className="text-sm text-red-700 mt-0.5">
            {isExpiry
              ? "We\u2019re sorry — we were unable to confirm your booking before the payment hold expired (holds are valid for 7 days)."
              : "We\u2019re sorry — your requested dates are no longer available. They were booked on another platform before we could verify your reservation."}
          </p>
          <p className="text-sm text-red-700 mt-1">
            Your payment hold has been <strong>released</strong>. No charge was made.
            The hold may take 1–5 business days to disappear from your statement.
          </p>
          <a href="/" className="inline-block mt-2 text-xs text-red-600 underline hover:text-red-900">
            Search other available dates →
          </a>
        </div>
      </div>
    );
  }

  if (status === "cancelled" || status === "expired") {
    return (
      <div className="rounded-xl bg-gray-100 border border-gray-200 px-5 py-4 mb-8 flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-400 text-white text-sm font-bold">
          ✗
        </div>
        <div>
          <p className="font-semibold text-gray-700">
            {status === "expired" ? "Reservation expired" : "Reservation cancelled"}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {status === "expired"
              ? "This reservation was not completed in time and has expired."
              : "This reservation has been cancelled."}
            {cancellationReason && ` Reason: ${cancellationReason}`}
          </p>
          <a href="/" className="inline-block mt-2 text-xs text-gray-600 underline hover:text-gray-900">
            Start a new reservation →
          </a>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BookingConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [booking, config, content] = await Promise.all([
    getBookingById(id),
    getConfig(),
    getContent(),
  ]);
  if (!booking) notFound();

  const isActive = booking.status === "confirmed" || booking.status === "pending_confirmation" || booking.status === "payment_authorized";
  const isCancelled = booking.status === "cancelled" || booking.status === "expired" || booking.status === "rejected";
  const isGuestCancellable = ["confirmed", "pending_confirmation", "pending_review"].includes(booking.status);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
            ← {config.name}
          </a>
          <span className="text-xs text-gray-400">Booking details</span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
        {/* Status banner */}
        <StatusBanner
          status={booking.status}
          confirmationCode={booking.confirmationCode}
          adminEmail={config.adminEmail}
          cancellationReason={booking.cancellationReason}
        />

        <div className="space-y-5">
          {/* Confirmation code */}
          <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">
              Booking reference
            </p>
            <p className="text-4xl font-bold text-gray-900 tracking-widest font-mono">
              {booking.confirmationCode}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Save this reference — you may need it when contacting the property.
            </p>
          </section>

          {/* Reservation details */}
          <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Reservation</h2>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Room</dt>
                <dd className="font-medium text-gray-900 text-right">{booking.roomName}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Check-in</dt>
                <dd className="font-medium text-gray-900">{fmtDate(booking.checkIn)}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Check-out</dt>
                <dd className="font-medium text-gray-900">{fmtDate(booking.checkOut)}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Duration</dt>
                <dd className="font-medium text-gray-900">
                  {booking.nights} {booking.nights === 1 ? "night" : "nights"}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Guests</dt>
                <dd className="font-medium text-gray-900">
                  {booking.guest.adults} adult{booking.guest.adults !== 1 ? "s" : ""}
                  {booking.guest.children > 0 && `, ${booking.guest.children} child${booking.guest.children !== 1 ? "ren" : ""}`}
                </dd>
              </div>
            </dl>
          </section>

          {/* Price */}
          {!isCancelled && (
            <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Price summary</h2>
              <PriceBreakdown
                breakdown={booking.priceBreakdown}
                totalPrice={booking.totalPrice}
                currency={booking.currency}
                nights={booking.nights}
              />
              {booking.payment.status === "paid" && booking.payment.paidAt && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
                  <span className="font-semibold">✓ Paid</span>
                  <span className="text-emerald-600">
                    via {booking.payment.method === "stripe" ? "card" : (booking.payment.method ?? "card")} on{" "}
                    {new Date(booking.payment.paidAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {booking.payment.status === "authorized" && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  <span className="font-semibold">⏳ Payment on hold</span>
                  <span className="text-amber-600">— not yet charged, pending availability confirmation</span>
                </div>
              )}
            </section>
          )}

          {/* Guest info */}
          <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Guest</h2>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{booking.guest.name}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">{booking.guest.email}</dd>
              </div>
              {booking.guest.phone && (
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="font-medium text-gray-900">{booking.guest.phone}</dd>
                </div>
              )}
              {booking.guest.notes && (
                <div className="text-sm pt-1">
                  <dt className="text-gray-500 mb-1">Special requests</dt>
                  <dd className="text-gray-700 bg-gray-50 rounded-md p-3 text-xs leading-relaxed border border-gray-100">
                    {booking.guest.notes}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* What to expect — only for confirmed bookings */}
          {booking.status === "confirmed" && (
            <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">What to expect</h2>
              <ul className="space-y-3 text-sm text-gray-600">
                {content.policies.checkIn && (
                  <li className="flex gap-2">
                    <span className="text-gray-300 shrink-0">→</span>
                    <span>Check-in from <strong>{content.policies.checkIn}</strong></span>
                  </li>
                )}
                {content.policies.checkOut && (
                  <li className="flex gap-2">
                    <span className="text-gray-300 shrink-0">→</span>
                    <span>Check-out by <strong>{content.policies.checkOut}</strong></span>
                  </li>
                )}
                {content.policies.cancellation && (
                  <li className="flex gap-2">
                    <span className="text-gray-300 shrink-0">→</span>
                    <span>{content.policies.cancellation}</span>
                  </li>
                )}
                {config.adminEmail && (
                  <li className="flex gap-2">
                    <span className="text-gray-300 shrink-0">→</span>
                    <span>
                      Questions before arrival?{" "}
                      <a href={`mailto:${config.adminEmail}`} className="text-primary underline hover:opacity-80">
                        Email us at {config.adminEmail}
                      </a>
                    </span>
                  </li>
                )}
              </ul>
            </section>
          )}

          {/* Guest self-service cancellation */}
          {isGuestCancellable && (
            <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Need to cancel?</h2>
              <CancelBookingButton bookingId={booking.id} />
            </section>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 pb-4">
            {booking.status === "payment_authorized" ? "Submitted" : isActive ? "Booked" : ""}{" "}
            {isActive || isCancelled ? "on" : ""}{" "}
            {fmtDateTime(booking.createdAt)}
            {booking.confirmedAt && ` · Confirmed ${fmtDateTime(booking.confirmedAt)}`}
          </p>
        </div>
      </main>
    </div>
  );
}
