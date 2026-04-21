export const dynamic = "force-dynamic";

import Link from "next/link";
import { getBookings } from "@/lib/bookings";
import { getBooking, getConfig } from "@/lib/property";
import BookingsList from "@/components/admin/BookingsList";

export default async function AdminBookingsPage() {
  const [allBookings, bookingConfig, config] = await Promise.all([
    getBookings(),
    getBooking(),
    getConfig(),
  ]);
  const bookings = allBookings.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const currency = bookingConfig.currency || "USD";
  const missingNotificationEmail = !config.adminEmail;

  return (
    <div>
      {missingNotificationEmail && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-amber-500 text-lg leading-none mt-0.5">⚠</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">
              Notification email not configured
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              You are not receiving any booking alerts, cancellations, or payment notifications.{" "}
              <Link href="/admin/settings" className="underline font-semibold hover:text-amber-900">
                Go to Settings →
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            {bookings.length} total reservation{bookings.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <BookingsList initialBookings={bookings} currency={currency} />
    </div>
  );
}
