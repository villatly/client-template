import Link from "next/link";
import SignOutButton from "@/components/admin/SignOutButton";
import { getBooking } from "@/lib/property";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const booking = await getBooking();
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm font-semibold text-gray-900">
              Admin
            </Link>
            <div className="flex gap-3">
              <Link href="/admin/bookings" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                Reservations
              </Link>
              <Link href="/admin/availability" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                Availability
              </Link>
              <Link href="/admin/content" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                Content
              </Link>
              <Link href="/admin/rooms" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                Rooms
              </Link>
              <Link href="/admin/gallery" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                Gallery
              </Link>
              <Link href="/admin/branding" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                Branding
              </Link>
              <Link href="/admin/sections" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                Sections
              </Link>
              <Link href="/admin/booking" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                Booking
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              View Site &rarr;
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
