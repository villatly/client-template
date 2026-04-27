"use client";

import { useState } from "react";
import type { ContactInfo, CTAButton } from "@/lib/types";
import { SaveBar } from "./DescriptionForm";

const MAX_CTA_BUTTONS = 4;

const inp = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

export default function ContactForm({ initial }: { initial: ContactInfo }) {
  const [form, setForm] = useState<ContactInfo>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setField<K extends keyof ContactInfo>(k: K, v: ContactInfo[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setSaved(false);
  }

  // ── CTA buttons helpers ───────────────────────────────────────────────
  const ctaButtons: CTAButton[] = form.ctaButtons ?? [];

  function updateBtn(i: number, field: keyof CTAButton, value: string) {
    const updated = ctaButtons.map((btn, idx) =>
      idx === i ? { ...btn, [field]: value } : btn
    );
    setField("ctaButtons", updated);
  }

  function addBtn() {
    if (ctaButtons.length >= MAX_CTA_BUTTONS) return;
    setField("ctaButtons", [...ctaButtons, { label: "", url: "" }]);
  }

  function removeBtn(i: number) {
    setField("ctaButtons", ctaButtons.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    // Strip empty buttons before saving
    const cleaned: ContactInfo = {
      ...form,
      ctaButtons: (form.ctaButtons ?? []).filter(b => b.label.trim() && b.url.trim()),
    };
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "contact", data: cleaned }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-6">

      {/* Basic contact info */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Contact details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
            <input
              value={form.email ?? ""}
              onChange={e => setField("email", e.target.value)}
              placeholder="hello@yourvilla.com"
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Phone</label>
            <input
              value={form.phone ?? ""}
              onChange={e => setField("phone", e.target.value)}
              placeholder="+1 234 567 890"
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">WhatsApp number</label>
            <input
              value={form.whatsapp ?? ""}
              onChange={e => setField("whatsapp", e.target.value)}
              placeholder="+62 812 3456 7890"
              className={inp}
            />
            <p className="mt-1 text-xs text-gray-400">Optional fallback. Prefer setting WhatsApp in <strong>Booking Settings</strong> — that field powers the whole site.</p>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">CTA buttons</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Shown in the Contact section. Add any external links (Booking.com, Airbnb, your own booking system, etc.). Max {MAX_CTA_BUTTONS}.
            </p>
          </div>
          {ctaButtons.length < MAX_CTA_BUTTONS && (
            <button
              onClick={addBtn}
              type="button"
              className="ml-4 shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              + Add button
            </button>
          )}
        </div>

        {ctaButtons.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center">
            <p className="text-sm text-gray-400">No CTA buttons yet.</p>
            <button
              onClick={addBtn}
              type="button"
              className="mt-2 text-xs text-gray-500 underline hover:text-gray-700"
            >
              Add your first button
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {ctaButtons.map((btn, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                  {i + 1}
                </span>
                <div className="flex flex-1 gap-2">
                  <div className="flex-1">
                    <input
                      value={btn.label}
                      onChange={e => updateBtn(i, "label", e.target.value)}
                      placeholder="Button label (e.g. Book on Airbnb)"
                      className={inp}
                    />
                  </div>
                  <div className="flex-[2]">
                    <input
                      value={btn.url}
                      onChange={e => updateBtn(i, "url", e.target.value)}
                      placeholder="https://..."
                      type="url"
                      className={inp}
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeBtn(i)}
                  type="button"
                  aria-label={`Remove button ${i + 1}`}
                  className="mt-1.5 shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                </button>
              </div>
            ))}
            <p className="text-xs text-gray-400">
              The first button is shown as the primary CTA. The rest appear as secondary links.
            </p>
          </div>
        )}
      </div>

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
