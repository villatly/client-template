"use client";

import { useState } from "react";
import type { GalleryItem } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";


export default function GalleryManager({ initial }: { initial: GalleryItem[] }) {
  const [items, setItems] = useState<GalleryItem[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function addItem(url: string) {
    if (!url) return;
    setItems((prev) => [...prev, { url, alt: "" }]);
    setSaved(false);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function updateAlt(idx: number, alt: string) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, alt } : item)));
    setSaved(false);
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
    setSaved(false);
  }

  function moveDown(idx: number) {
    if (idx === items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/gallery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
    else setError("Failed to save. Please try again.");
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Upload new image */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Add Photo</h2>
        <ImageUpload
          value=""
          onChange={(url) => { if (url) addItem(url); }}
          aspectClass="aspect-video"
        />
      </section>

      {/* Gallery grid */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-sm text-gray-400">No images yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.alt}
                className="h-16 w-24 shrink-0 rounded-md object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
              />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-xs text-gray-400 truncate">{item.url}</p>
                <input
                  type="text"
                  value={item.alt}
                  onChange={(e) => updateAlt(i, e.target.value)}
                  placeholder="Alt text"
                  className="block w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(i)}
                  disabled={i === items.length - 1}
                  className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="rounded p-1 text-red-400 hover:text-red-600"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{items.length} image{items.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-emerald-600">Saved!</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Gallery"}
          </button>
        </div>
      </div>
    </div>
  );
}
