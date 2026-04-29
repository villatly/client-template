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
  const [reseeding, setReseeding]     = useState(false);
  const [reseedDone, setReseedDone]   = useState(false);
  const [reseedError, setReseedError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const CONFIRM_WORD = "SYNC";

  async function reseed() {
    setShowConfirm(false);
    setConfirmText("");
    setReseeding(true);
    setReseedDone(false);
    setReseedError("");
    try {
      const res = await fetch("/api/admin/reseed", { method: "POST" });
      if (res.ok) {
        setReseedDone(true);
      } else {
        setReseedError("Sync failed. Check the server logs.");
      }
    } catch {
      setReseedError("Network error. Try again.");
    }
    setReseeding(false);
  }

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
            Used in email subjects and the admin panel header. Also update it in{" "}
            <strong className="text-gray-600">Content → Property Info</strong> to keep your website in sync — the two are stored separately.
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

      {/* Sync from deployment */}
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Sync Content from Deployment</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Overwrites the live database with the content files bundled in this deployment.
            Use after pushing new content to the server.
          </p>
        </div>
        {reseedDone && (
          <p className="text-sm text-emerald-700 font-medium">✓ Sync complete — reload the page to see the updated content.</p>
        )}
        {reseedError && (
          <p className="text-sm text-red-600 font-medium">{reseedError}</p>
        )}
        <button
          type="button"
          onClick={() => { setShowConfirm(true); setConfirmText(""); setReseedDone(false); setReseedError(""); }}
          disabled={reseeding}
          className="rounded-md bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          {reseeding ? "Syncing…" : "Sync from deployment files"}
        </button>
      </section>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">This will overwrite all live content</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All changes made through the admin panel (texts, images, colors, pricing…)
                  will be permanently replaced by the content files in this deployment.
                  <strong className="text-gray-700"> This cannot be undone.</strong>
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Type <span className="font-mono font-bold text-red-600">{CONFIRM_WORD}</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value.toUpperCase())}
                placeholder={CONFIRM_WORD}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono tracking-widest text-gray-900 placeholder:text-gray-300 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => { setShowConfirm(false); setConfirmText(""); }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={reseed}
                disabled={confirmText !== CONFIRM_WORD}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Yes, overwrite everything
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
