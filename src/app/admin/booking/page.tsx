import { getBooking } from "@/lib/property";
import BookingSettingsForm from "@/components/admin/BookingSettingsForm";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const booking = await getBooking();

  // Check whether the minimum Stripe credentials are present in the server environment.
  // This boolean is the only payment-related signal passed to the client — no key names,
  // file names, or setup instructions are ever sent to the browser.
  const paymentsReady =
    !!process.env.STRIPE_SECRET_KEY &&
    !!process.env.STRIPE_WEBHOOK_SECRET &&
    !!process.env.NEXT_PUBLIC_URL;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Booking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure how guests book or check availability on your site.
        </p>
      </div>
      <BookingSettingsForm initial={booking} paymentsReady={paymentsReady} />
    </div>
  );
}
