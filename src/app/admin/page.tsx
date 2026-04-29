import Link from "next/link";
import { getConfig, getBooking } from "@/lib/property";
import { getBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [config, booking, bookings] = await Promise.all([
    getConfig(),
    getBooking(),
    getBookings(),
  ]);
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const pendingCount   = bookings.filter(
    (b) => b.status === "pending_review" || b.status === "pending_confirmation" || b.status === "payment_failed"
  ).length;

  const modeLabel = booking.mode === "request_to_book" ? "Request to Book" : "Instant Book";

  const cards = [
    {
      href: "/admin/bookings",
      label: "Reservations",
      desc: pendingCount > 0
        ? `${confirmedCount} confirmed · ${pendingCount} need${pendingCount === 1 ? "s" : ""} attention`
        : `${confirmedCount} confirmed · ${bookings.length} total`,
      highlight: pendingCount > 0,
    },
    {
      href: "/admin/availability",
      label: "Availability",
      desc: "Manage room calendars, blocked dates, seasonal pricing, and iCal sync.",
      highlight: false,
    },
    {
      href: "/admin/content",
      label: "Content",
      desc: "Edit descriptions, amenities, reviews, policies, and more.",
      highlight: false,
    },
    {
      href: "/admin/rooms",
      label: "Rooms",
      desc: "Manage room types, capacity, images, and descriptions.",
      highlight: false,
    },
    {
      href: "/admin/gallery",
      label: "Gallery",
      desc: "Upload and organise property photos.",
      highlight: false,
    },
    {
      href: "/admin/branding",
      label: "Branding",
      desc: "Customise colors, logo, favicon, page layout, and section colors.",
      highlight: false,
    },
    {
      href: "/admin/sections",
      label: "Sections",
      desc: "Show or hide page sections like gallery, reviews, or FAQ.",
      highlight: false,
    },
    {
      href: "/admin/booking",
      label: "Booking",
      desc: `Mode: ${modeLabel} · Configure currency, CTA label, WhatsApp, and contact details.`,
      highlight: false,
    },
    {
      href: "/admin/settings",
      label: "Settings",
      desc: "Notification email, property timezone, and deployment sync.",
      highlight: false,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">{config.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {config.propertyType} &middot; {config.location}, {config.country}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`rounded-lg border bg-white p-5 shadow-sm hover:shadow-md transition-shadow ${
              card.highlight ? "border-amber-300 bg-amber-50" : "border-gray-200"
            }`}
          >
            <h2 className={`text-sm font-semibold ${card.highlight ? "text-amber-900" : "text-gray-900"}`}>
              {card.label}
              {card.highlight && (
                <span className="ml-2 inline-block rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none align-middle">
                  !
                </span>
              )}
            </h2>
            <p className={`mt-1 text-xs ${card.highlight ? "text-amber-700" : "text-gray-500"}`}>
              {card.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
