/**
 * /booking/cancel?id=BOOKING_ID
 *
 * Shown when the guest clicks "Back" or "Cancel" on the Stripe Checkout page.
 * The booking stays in "pending_payment" — it hasn't been cancelled yet.
 * The Stripe session expires after ~30 minutes, at which point the webhook
 * moves it to "expired" and the dates open back up.
 */

import { getBookingById } from "@/lib/bookings";
import { getConfig } from "@/lib/property";

export const dynamic = "force-dynamic";

function fmtDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BookingCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const [booking, config] = await Promise.all([
    id ? getBookingById(id) : Promise.resolve(null),
    getConfig(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
            ← {config.name}
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment not completed</h1>
          <p className="text-sm text-gray-500 mb-1">
            You left the payment page — no charge was made.
          </p>

          {booking && (
            <div className="mt-4 mb-4 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-left">
              <p className="text-xs font-medium text-gray-500 mb-1">Your reservation details</p>
              <p className="text-sm font-semibold text-gray-900">{booking.roomName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {fmtDate(booking.checkIn)} — {fmtDate(booking.checkOut)}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400 mb-6">
            Your spot is held for a short time. You can try again now or start a new search.
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="/#availability"
              className="inline-block rounded-md bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              Book again
            </a>
            <a
              href="/"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Return to home
            </a>
          </div>

          {config.adminEmail && (
            <p className="mt-6 text-xs text-gray-400">
              Need help?{" "}
              <a href={`mailto:${config.adminEmail}`} className="underline hover:text-gray-600">
                Contact us
              </a>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
