"use client";

import { useState } from "react";
import type { BookingConfig, BookingMode } from "@/lib/types";
import { SaveBar } from "./DescriptionForm";

const inp = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

const MODES: { value: BookingMode; label: string; description: string; badge: string }[] = [
  {
    value: "instant_book",
    label: "Instant Book",
    description: "Guest searches, pays via Stripe, and is confirmed immediately. Best for high-occupancy properties that don't need manual review.",
    badge: "bg-emerald-100 text-emerald-800",
  },
  {
    value: "request_to_book",
    label: "Request to Book",
    description: "Guest submits a request with no payment. You review it and accept or decline. If accepted, the guest receives a payment link. Best for properties that want full control over bookings.",
    badge: "bg-blue-100 text-blue-800",
  },
];

export default function BookingSettingsForm({
  initial,
  paymentsReady,
}: {
  initial: BookingConfig;
  paymentsReady: boolean;
}) {
  const [form, setForm]     = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  function set<K extends keyof BookingConfig>(k: K, v: BookingConfig[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/booking", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-6">

      {/* Mode selector */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Booking Mode</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Choose how guests book with you. You can change this at any time — existing bookings are not affected.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => set("mode", mode.value)}
              className={`relative flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-colors ${
                form.mode === mode.value
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-400"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-900">{mode.label}</span>
                {form.mode === mode.value && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${mode.badge}`}>
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{mode.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Payment status */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Online Payments (Stripe)</h2>

        {paymentsReady ? (
          <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-medium text-emerald-800">Stripe is active</p>
              <p className="mt-0.5 text-xs text-emerald-700">
                {form.mode === "instant_book"
                  ? "Guests are charged at checkout. Dates are only confirmed after payment is received."
                  : "When you accept a request, the guest receives a secure payment link. Dates are blocked after payment."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-800">Stripe not configured</p>
              <p className="mt-0.5 text-xs text-amber-700">
                {form.mode === "instant_book"
                  ? "Instant Book requires Stripe. Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and NEXT_PUBLIC_URL to your environment."
                  : "Request to Book works without Stripe for receiving requests. Stripe is required to send payment links when you accept."}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Booking settings */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Booking Settings</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">CTA Button Label</label>
            <input
              value={form.ctaLabel}
              onChange={e => set("ctaLabel", e.target.value)}
              placeholder="e.g. Check Availability"
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Currency</label>
            <input
              value={form.currency}
              onChange={e => set("currency", e.target.value.toUpperCase())}
              placeholder="USD"
              className={inp}
            />
            <p className="mt-1 text-xs text-gray-400">ISO 4217 code: USD, EUR, GBP, IDR, AUD…</p>
          </div>
        </div>
      </section>

      {/* Fallback contact */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Fallback Contact</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Shown to guests when they need to reach you directly (e.g. payment fails, special requests).
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Preferred Contact Method</label>
          <select
            value={form.contactMethod}
            onChange={e => set("contactMethod", e.target.value as "email" | "whatsapp")}
            className={inp}
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Booking Email</label>
            <input
              type="email"
              value={form.bookingEmail}
              onChange={e => set("bookingEmail", e.target.value)}
              placeholder="reservations@yourvilla.com"
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">WhatsApp Number</label>
            <input
              value={form.bookingWhatsapp}
              onChange={e => set("bookingWhatsapp", e.target.value)}
              placeholder="+62 812 345 6789"
              className={inp}
            />
            <p className="mt-1 text-xs text-gray-400">Include country code. Powers the floating WhatsApp button, the booking bar, and all contact sections across the site.</p>
          </div>
        </div>
      </section>

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
