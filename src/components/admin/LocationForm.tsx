"use client";

import { useState } from "react";
import type { LocationContent } from "@/lib/types";
import { SaveBar } from "./DescriptionForm";

const inp = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

export default function LocationForm({ initial }: { initial: LocationContent }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof LocationContent>(k: K, v: LocationContent[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "location", data: form }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Area Name</label>
        <input value={form.areaName} onChange={e => set("areaName", e.target.value)} placeholder="e.g. Ubud, Bali" className={inp} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
        <textarea rows={4} value={form.description} onChange={e => set("description", e.target.value)}
          placeholder="Describe the location and surroundings…" className={`${inp} resize-y`} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Google Maps URL</label>
        <input value={form.mapUrl} onChange={e => set("mapUrl", e.target.value)}
          placeholder="https://maps.google.com/?q=…" className={inp} />
        <p className="mt-1 text-xs text-gray-400">Paste any Google Maps link — coordinates, place URL, or share link. The embed is handled automatically.</p>
      </div>
      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
