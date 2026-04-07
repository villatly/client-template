"use client";

import { useState } from "react";
import type { Amenity } from "@/lib/types";
import { SaveBar } from "./DescriptionForm";

const inp = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

export default function AmenitiesEditor({ initial }: { initial: Amenity[] }) {
  const [items, setItems] = useState<Amenity[]>(initial);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function add() {
    const label = input.trim();
    if (!label) return;
    setItems(prev => [...prev, { label }]);
    setInput("");
    setSaved(false);
  }

  function remove(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "amenities", data: items }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="e.g. Private infinity pool" className={inp} />
        <button type="button" onClick={add}
          className="shrink-0 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((a, i) => (
          <span key={i} className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
            {a.label}
            <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-gray-700">&times;</button>
          </span>
        ))}
      </div>
      {items.length === 0 && <p className="text-sm text-gray-400">No amenities yet.</p>}
      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
