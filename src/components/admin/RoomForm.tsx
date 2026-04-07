"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RoomUnit } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";

interface RoomFormProps {
  initial?: Partial<RoomUnit>;
  isNew?: boolean;
}

const emptyRoom: Partial<RoomUnit> = {
  name: "",
  shortDescription: "",
  description: "",
  image: "",
  capacity: 2,
  bedType: "",
  bathroomType: "",
  size: "",
  priceFrom: "",
  highlights: [],
  amenities: [],
  ctaLabel: "",
  ctaUrl: "",
  isFeatured: false,
};

export default function RoomForm({ initial = {}, isNew = false }: RoomFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<Partial<RoomUnit>>({ ...emptyRoom, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Array field helpers
  const [highlightInput, setHighlightInput] = useState("");
  const [amenityInput, setAmenityInput] = useState("");
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [galleryAltInput, setGalleryAltInput] = useState("");

  function set<K extends keyof RoomUnit>(key: K, value: RoomUnit[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addToArray(key: "highlights" | "amenities", value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    set(key, [...(form[key] ?? []), trimmed]);
  }

  function removeFromArray(key: "highlights" | "amenities", idx: number) {
    set(key, (form[key] ?? []).filter((_, i) => i !== idx));
  }

  function addGalleryImage() {
    const url = galleryUrlInput.trim();
    if (!url) return;
    set("gallery", [...(form.gallery ?? []), { url, alt: galleryAltInput.trim() }]);
    setGalleryUrlInput("");
    setGalleryAltInput("");
  }

  function removeGalleryImage(idx: number) {
    set("gallery", (form.gallery ?? []).filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) { setError("Room name is required."); return; }
    setSaving(true);
    setError("");

    const url = isNew ? "/api/admin/rooms" : `/api/admin/rooms/${initial.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setError("Failed to save. Please try again.");
      setSaving(false);
      return;
    }

    router.push("/admin/rooms");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Core info */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Room Name *">
              <input
                type="text"
                value={form.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Master Suite, Ocean Dorm"
                className={inputClass}
                required
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Short Description">
              <input
                type="text"
                value={form.shortDescription ?? ""}
                onChange={(e) => set("shortDescription", e.target.value)}
                placeholder="One-line teaser shown in listings"
                className={inputClass}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description *">
              <textarea
                rows={4}
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Full description of the room..."
                className={`${inputClass} resize-y`}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Media */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Main Image</h2>
        <ImageUpload
          value={form.image ?? ""}
          onChange={(url) => set("image", url)}
          aspectClass="aspect-[4/3]"
        />
      </section>

      {/* Gallery */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Gallery Images</h2>
        <p className="mb-4 text-xs text-gray-400">Additional photos shown in the room detail popup.</p>

        {/* Existing images */}
        {(form.gallery ?? []).length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(form.gallery ?? []).map((img, i) => (
              <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-red-600 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload new gallery image */}
        <ImageUpload
          value=""
          onChange={(url) => {
            if (url) {
              set("gallery", [...(form.gallery ?? []), { url, alt: "" }]);
            }
          }}
          aspectClass="aspect-[4/3]"
          label="Add photo"
        />
      </section>

      {/* Specs */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Room Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Max Guests">
            <input
              type="number"
              min={1}
              max={20}
              value={form.capacity ?? 2}
              onChange={(e) => set("capacity", parseInt(e.target.value, 10))}
              className={inputClass}
            />
          </Field>
          <Field label="Bed Type">
            <input
              type="text"
              value={form.bedType ?? ""}
              onChange={(e) => set("bedType", e.target.value)}
              placeholder="e.g. 1 King, 2 Single, 6 Bunk Beds"
              className={inputClass}
            />
          </Field>
          <Field label="Bathroom">
            <input
              type="text"
              value={form.bathroomType ?? ""}
              onChange={(e) => set("bathroomType", e.target.value)}
              placeholder="e.g. Private en-suite, Shared"
              className={inputClass}
            />
          </Field>
          <Field label="Room Size">
            <input
              type="text"
              value={form.size ?? ""}
              onChange={(e) => set("size", e.target.value)}
              placeholder="e.g. 45 sqm"
              className={inputClass}
            />
          </Field>
          <Field label="Price From (display only)">
            <input
              type="text"
              value={form.priceFrom ?? ""}
              onChange={(e) => set("priceFrom", e.target.value)}
              placeholder="e.g. $120/night"
              className={inputClass}
            />
          </Field>
          <Field label="Display Order">
            <input
              type="number"
              min={0}
              value={form.displayOrder ?? 0}
              onChange={(e) => set("displayOrder", parseInt(e.target.value, 10))}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            id="featured"
            checked={form.isFeatured ?? false}
            onChange={(e) => set("isFeatured", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-gray-900"
          />
          <label htmlFor="featured" className="text-sm text-gray-700">
            Mark as featured room
          </label>
        </div>
      </section>

      {/* Highlights */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Highlights</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={highlightInput}
            onChange={(e) => setHighlightInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addToArray("highlights", highlightInput);
                setHighlightInput("");
              }
            }}
            placeholder="Type a highlight and press Enter"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => { addToArray("highlights", highlightInput); setHighlightInput(""); }}
            className="shrink-0 rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Add
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(form.highlights ?? []).map((h, i) => (
            <span key={i} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
              {h}
              <button type="button" onClick={() => removeFromArray("highlights", i)} className="text-gray-400 hover:text-gray-700">
                &times;
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Room amenities */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Room Amenities</h2>
        <p className="mb-3 text-xs text-gray-400">Specific amenities for this room (e.g. Private pool, Nespresso, Smart TV)</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addToArray("amenities", amenityInput);
                setAmenityInput("");
              }
            }}
            placeholder="Type an amenity and press Enter"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => { addToArray("amenities", amenityInput); setAmenityInput(""); }}
            className="shrink-0 rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Add
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(form.amenities ?? []).map((a, i) => (
            <span key={i} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
              {a}
              <button type="button" onClick={() => removeFromArray("amenities", i)} className="text-gray-400 hover:text-gray-700">
                &times;
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Call to Action (optional)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Button Label">
            <input
              type="text"
              value={form.ctaLabel ?? ""}
              onChange={(e) => set("ctaLabel", e.target.value)}
              placeholder="e.g. Book This Room"
              className={inputClass}
            />
          </Field>
          <Field label="Button URL">
            <input
              type="text"
              value={form.ctaUrl ?? ""}
              onChange={(e) => set("ctaUrl", e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <a href="/admin/rooms" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          &larr; Cancel
        </a>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : isNew ? "Create Room" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";
