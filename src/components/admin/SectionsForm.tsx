"use client";

import { useState } from "react";
import type { SectionVisibility } from "@/lib/types";

const sectionLabels: Record<keyof SectionVisibility, string> = {
  hero: "Hero",
  bookingCta: "Booking CTA Bar",
  about: "About / Description",
  gallery: "Photo Gallery",
  rooms: "Rooms / Accommodation",
  amenities: "Amenities",
  reviews: "Guest Reviews",
  faq: "FAQ",
  location: "Location & Map",
  nearbyAttractions: "Nearby Attractions",
  policies: "Policies & Stay Info",
  contactCta: "Contact CTA",
  footer: "Footer",
};

export default function SectionsForm({ initial }: { initial: SectionVisibility }) {
  const [sections, setSections] = useState<SectionVisibility>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof SectionVisibility) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sections),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
        {(Object.keys(sectionLabels) as (keyof SectionVisibility)[]).map((key) => (
          <div key={key} className="flex items-center justify-between px-5 py-3.5">
            <span className="text-sm text-gray-900">{sectionLabels[key]}</span>
            <button
              type="button"
              onClick={() => toggle(key)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                sections[key] ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  sections[key] ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-emerald-600">Saved!</span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
