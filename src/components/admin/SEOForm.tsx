"use client";

import { useState } from "react";
import type { SEOContent } from "@/lib/types";
import { SaveBar } from "./DescriptionForm";
import ImageUpload from "./ImageUpload";

const inp = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

export default function SEOForm({ initial }: { initial: SEOContent }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof SEOContent>(k: K, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "seo", data: form }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Page Title <span className="text-gray-400">(shown in browser tab &amp; search results)</span></label>
        <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Villa Name | Tagline" className={inp} />
        <p className={`mt-1 text-xs ${form.title.length > 60 ? "text-amber-600" : "text-gray-400"}`}>{form.title.length}/60 characters</p>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Meta Description <span className="text-gray-400">(shown in search results)</span></label>
        <textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)}
          placeholder="Brief description for search engines…" className={`${inp} resize-y`} />
        <p className={`mt-1 text-xs ${form.description.length > 160 ? "text-amber-600" : "text-gray-400"}`}>{form.description.length}/160 characters</p>
      </div>
      <div>
        <ImageUpload value={form.ogImage} onChange={url => set("ogImage", url)} aspectClass="aspect-video" label="Social Share Image (OG Image)" />
      </div>
      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
