"use client";

import { useState } from "react";
import type { PropertyIdentity } from "@/lib/types";
import { SaveBar } from "./DescriptionForm";

const inp = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

export default function IdentityForm({ initial }: { initial: PropertyIdentity }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof PropertyIdentity>(k: K, v: PropertyIdentity[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "identity", data: form }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Property Name</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Villa Amara" className={inp} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Property Type</label>
          <select value={form.propertyType} onChange={e => set("propertyType", e.target.value as PropertyIdentity["propertyType"])} className={inp}>
            <option value="villa">Villa</option>
            <option value="hostel">Hostel</option>
            <option value="apartment">Apartment</option>
            <option value="homestay">Homestay</option>
            <option value="guesthouse">Guesthouse</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Location / City</label>
          <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Ubud, Bali" className={inp} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Country</label>
          <input value={form.country} onChange={e => set("country", e.target.value)} placeholder="e.g. Indonesia" className={inp} />
        </div>
      </div>
      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
