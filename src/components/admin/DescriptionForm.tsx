"use client";

import { useState } from "react";
import type { DescriptionContent } from "@/lib/types";
import ImageField from "./ImageField";

const ta = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 resize-y";

export default function DescriptionForm({ initial }: { initial: DescriptionContent }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof DescriptionContent>(k: K, v: DescriptionContent[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "description", data: form }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Short Description <span className="text-gray-400">(shown in listings / cards)</span></label>
        <textarea rows={3} value={form.short} onChange={e => set("short", e.target.value)} className={ta} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Long Description <span className="text-gray-400">(shown in About section)</span></label>
        <textarea rows={7} value={form.long} onChange={e => set("long", e.target.value)} className={ta} />
      </div>
      <ImageField
        label="About Image"
        hint="(optional — adds a side-by-side image next to the description)"
        value={form.image ?? ""}
        onChange={v => set("image", v || undefined)}
      />
      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}

export function SaveBar({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {saved && <span className="text-sm text-emerald-600">Saved!</span>}
      <button type="button" onClick={onSave} disabled={saving}
        className="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors">
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
