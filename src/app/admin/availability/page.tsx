import { getBooking, getAvailability, getContent } from "@/lib/property";
import AvailabilityManager from "@/components/admin/AvailabilityManager";
import ICalManager from "@/components/admin/ICalManager";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const [booking, availability, content] = await Promise.all([
    getBooking(),
    getAvailability(),
    getContent(),
  ]);
  const currency = booking.currency || "USD";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Availability</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage blocked dates and pricing for each room. Optionally sync with external calendars (Airbnb, Booking.com).
        </p>
      </div>
      <AvailabilityManager initial={availability} rooms={content.rooms} currency={currency} />
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Calendar Sync (iCal)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Import blocked dates from Airbnb, Booking.com, or any iCal-compatible platform.
          Synced blocks are read-only — manage your own blocks in the section above.
        </p>
        <ICalManager initial={availability} rooms={content.rooms} />
      </div>
    </div>
  );
}
