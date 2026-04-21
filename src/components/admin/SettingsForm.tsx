"use client";

import { useState } from "react";
import type { PropertyConfig } from "@/lib/types";
import { SaveBar } from "./DescriptionForm";

const inp = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

// Common IANA timezones for hospitality properties
const COMMON_TIMEZONES = [
  { value: "Asia/Makassar",       label: "Bali / Lombok (WITA, UTC+8)" },
  { value: "Asia/Jakarta",        label: "Jakarta / Java (WIB, UTC+7)" },
  { value: "Asia/Singapore",      label: "Singapore / Kuala Lumpur (SGT, UTC+8)" },
  { value: "Asia/Bangkok",        label: "Bangkok / Phuket (ICT, UTC+7)" },
  { value: "Asia/Manila",         label: "Philippines (PHT, UTC+8)" },
  { value: "Asia/Tokyo",          label: "Japan (JST, UTC+9)" },
  { value: "Asia/Dubai",          label: "Dubai / UAE (GST, UTC+4)" },
  { value: "Europe/Lisbon",       label: "Lisbon / Portugal (WET/WEST)" },
  { value: "Europe/Madrid",       label: "Spain / Canary Islands (CET/CEST)" },
  { value: "Europe/Paris",        label: "France / Central Europe (CET/CEST)" },
  { value: "Europe/Rome",         label: "Italy / Rome (CET/CEST)" },
  { value: "Europe/London",       label: "United Kingdom (GMT/BST)" },
  { value: "America/New_York",    label: "New York / Eastern US (ET)" },
  { value: "America/Chicago",     label: "Chicago / Central US (CT)" },
  { value: "America/Denver",      label: "Denver / Mountain US (MT)" },
  { value: "America/Los_Angeles", label: "Los Angeles / Pacific US (PT)" },
  { value: "America/Sao_Paulo",   label: "São Paulo / Brazil (BRT)" },
  { value: "America/Mexico_City", label: "Mexico City (CST/CDT)" },
  { value: "Australia/Sydney",    label: "Sydney / Melbourne (AEST/AEDT)" },
  { value: "Pacific/Auckland",    label: "New Zealand (NZST/NZDT)" },
  { value: "Africa/Nairobi",      label: "Kenya / East Africa (EAT, UTC+3)" },
  { value: "UTC",                 label: "UTC (no offset)" },
];

export default function SettingsForm({ initial }: { initial: PropertyConfig }) {
  const [form, setForm]     = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  function set<K extends keyof PropertyConfig>(k: K, v: PropertyConfig[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setSaved(false);
    setError("");
  }

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSaved(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save settings");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">

      {/* Notifications */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Booking Notification Email</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Where booking alerts, cancellations, and payment notifications are sent. This can be any email address.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Notification Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={form.adminEmail ?? ""}
            onChange={e => set("adminEmail", e.target.value)}
            placeholder="reservations@yourvilla.com"
            className={inp}
          />
          <p className="mt-1 text-xs text-gray-400">
            Receives: new bookings, cancellations, payment failures, and refund alerts.
          </p>
        </div>

        <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500 leading-relaxed">
          <strong>Login vs notifications:</strong> Your admin panel login email is fixed in your Vercel environment variables (<code className="font-mono bg-gray-200 px-1 rounded text-[11px]">ADMIN_EMAIL</code>) and cannot be changed here. This field only controls where booking notifications are delivered — it can be a different address.
        </div>
      </section>

      {/* Display name used in emails */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Property Name in Emails</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            This name appears in the header and subject line of all emails sent to guests.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Property Name</label>
          <input
            value={form.name ?? ""}
            onChange={e => set("name", e.target.value)}
            placeholder="e.g. Villa Amara"
            className={inp}
          />
          <p className="mt-1 text-xs text-gray-400">
            Also update it in Content → Property Info to keep your website in sync.
          </p>
        </div>
      </section>

      {/* Timezone */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Timezone</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Used to display check-in and check-out times correctly for your location.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Property Timezone</label>
          <select
            value={form.timezone ?? "UTC"}
            onChange={e => set("timezone", e.target.value)}
            className={inp}
          >
            {COMMON_TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
