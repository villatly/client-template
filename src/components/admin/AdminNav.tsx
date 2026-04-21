"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

const NAV_LINKS = [
  { href: "/admin/bookings",    label: "Reservations" },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/content",     label: "Content" },
  { href: "/admin/rooms",       label: "Rooms" },
  { href: "/admin/gallery",     label: "Gallery" },
  { href: "/admin/branding",    label: "Branding" },
  { href: "/admin/sections",    label: "Sections" },
  { href: "/admin/booking",     label: "Booking" },
  { href: "/admin/settings",    label: "Settings" },
];

export default function AdminNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <div className="flex h-12 items-center justify-between">

          {/* Left: logo + desktop links */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm font-semibold text-gray-900"
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>

            {/* Desktop nav — hidden on small screens */}
            <div className="hidden md:flex gap-3">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-xs transition-colors ${
                    pathname?.startsWith(href)
                      ? "font-semibold text-gray-900"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: view site + sign out + hamburger */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:block text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              View Site &rarr;
            </Link>
            <SignOutButton />

            {/* Hamburger button — visible on mobile only */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors md:hidden"
            >
              {open ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown ──────────────────────────────────────────── */}
        {open && (
          <div className="border-t border-gray-100 pb-3 pt-1 md:hidden">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-2 py-2.5 text-sm transition-colors ${
                  pathname?.startsWith(href)
                    ? "bg-gray-50 font-semibold text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-2">
              <Link
                href="/"
                target="_blank"
                onClick={() => setOpen(false)}
                className="block rounded-md px-2 py-2.5 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
              >
                View Site &rarr;
              </Link>
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}
