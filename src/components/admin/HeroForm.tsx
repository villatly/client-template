"use client";

import { useState } from "react";
import type { HeroContent } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";

const inputClass =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

export default function HeroForm({ initial }: { initial: HeroContent }) {
  const [form, setForm] = useState<HeroContent>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof HeroContent>(key: K, value: HeroContent[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (!form.headline.trim()) { setError("Headline is required."); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
    else setError("Failed to save. Please try again.");
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Title *
          <span className="ml-1 font-normal text-gray-400">— usually the property name. Max ~35 characters.</span>
        </label>
        <input
          type="text"
          value={form.headline}
          onChange={(e) => set("headline", e.target.value)}
          placeholder="e.g. Villa Amara"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Tagline
          <span className="ml-1 font-normal text-gray-400">— fallback eyebrow if no location is set. 5–8 words max.</span>
        </label>
        <input
          type="text"
          value={form.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          placeholder="e.g. Boutique villa with pool in Ubud"
          className={inputClass}
        />
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <label className="block text-xs font-medium text-gray-700">
            Subtitle
            <span className="ml-1 font-normal text-gray-400">— 2–3 benefits, no ratings. Displays as two lines max.</span>
          </label>
          <span className={`text-xs tabular-nums ${form.intro.length > 130 ? "text-red-500 font-medium" : "text-gray-400"}`}>
            {form.intro.length}/130
          </span>
        </div>
        <textarea
          rows={3}
          maxLength={130}
          value={form.intro}
          onChange={(e) => set("intro", e.target.value)}
          placeholder="e.g. Private pool villa in Ubud with jungle views, daily breakfast, and 5-min walk to the rice terraces."
          className={`${inputClass} resize-y`}
        />
      </div>

      <div>
        <ImageUpload
          value={form.image}
          onChange={(url) => set("image", url)}
          aspectClass="aspect-video"
          label="Hero Image"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 border-t border-gray-100 pt-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Primary CTA Label</label>
          <input
            type="text"
            value={form.primaryCTA.label}
            onChange={(e) => set("primaryCTA", { ...form.primaryCTA, label: e.target.value })}
            placeholder="e.g. Book Now"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Primary CTA URL</label>
          <input
            type="text"
            value={form.primaryCTA.url}
            onChange={(e) => set("primaryCTA", { ...form.primaryCTA, url: e.target.value })}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Secondary CTA Label</label>
          <input
            type="text"
            value={form.secondaryCTA.label}
            onChange={(e) => set("secondaryCTA", { ...form.secondaryCTA, label: e.target.value })}
            placeholder="e.g. See Rooms"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Secondary CTA URL</label>
          <input
            type="text"
            value={form.secondaryCTA.url}
            onChange={(e) => set("secondaryCTA", { ...form.secondaryCTA, url: e.target.value })}
            placeholder="#rooms or https://..."
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && <span className="text-sm text-emerald-600">Saved!</span>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Hero"}
        </button>
      </div>
    </div>
  );
}
