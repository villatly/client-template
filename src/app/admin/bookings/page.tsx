export const dynamic = "force-dynamic";

import { getBookings } from "@/lib/bookings";
import { getBooking } from "@/lib/property";
import BookingsList from "@/components/admin/BookingsList";

export default async function AdminBookingsPage() {
  const [allBookings, bookingConfig] = await Promise.all([
    getBookings(),
    getBooking(),
  ]);
  const bookings = allBookings.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const currency = bookingConfig.currency || "USD";

  return (
    <div>
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
