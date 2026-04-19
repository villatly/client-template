"use client";

import { useState } from "react";
import type { BrandingConfig } from "@/lib/types";
import { LAYOUT_PRESETS, type LayoutPreset } from "@/lib/layout";

const inputClass =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

interface BrandingFormProps {
  initial: BrandingConfig;
  premiumLayouts?: boolean;
}

export default function BrandingForm({ initial, premiumLayouts = false }: BrandingFormProps) {
  const [form, setForm] = useState<BrandingConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof BrandingConfig>(key: K, value: BrandingConfig[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function setSectionColor(key: string, value: string) {
    setForm((prev) => ({
      ...prev,
      sectionColors: { ...prev.sectionColors, [key]: value || undefined },
    }));
    setSaved(false);
  }

  const sectionLabels: Record<string, string> = {
    bookingCta: "Barra de reserva",
    about: "Sobre nosotros",
    gallery: "Galería",
    rooms: "Habitaciones / Rooms",
    amenities: "Comodidades",
    reviews: "Reseñas",
    faq: "Preguntas frecuentes",
    location: "Ubicación",
    nearbyAttractions: "Atracciones cercanas",
    policies: "Políticas",
    contactCta: "Contacto CTA",
    footer: "Pie de página",
  };

  async function handleSave() {
    setSaving(true);
    await fetch("/api/admin/branding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
  }

  const currentPreset: LayoutPreset = form.layoutPreset ?? "default";

  return (
    <div className="space-y-6">
      {/* Colors */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Colors</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {(["primaryColor", "secondaryColor", "accentColor"] as const).map((key) => (
            <div key={key}>
              <label className="mb-2 block text-xs font-medium text-gray-700 capitalize">
                {key.replace("Color", "").replace(/([A-Z])/g, " $1")} Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-gray-300 p-0.5"
                />
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder="#000000"
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Style */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Style</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Button Style</label>
            <select
              value={form.buttonStyle}
              onChange={(e) => set("buttonStyle", e.target.value as BrandingConfig["buttonStyle"])}
              className={inputClass}
            >
              <option value="rounded">Rounded</option>
              <option value="pill">Pill</option>
              <option value="square">Square</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Font Style</label>
            <select
              value={form.fontStyle}
              onChange={(e) => set("fontStyle", e.target.value as BrandingConfig["fontStyle"])}
              className={inputClass}
            >
              <option value="modern">Modern (sans-serif)</option>
              <option value="serif">Serif</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
        </div>
      </section>

      {/* Layout Preset */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Page Layout</h2>
          {!premiumLayouts && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Premium presets locked
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.entries(LAYOUT_PRESETS) as [LayoutPreset, typeof LAYOUT_PRESETS[LayoutPreset]][]).map(([key, meta]) => {
            const isLocked = meta.premium && !premiumLayouts;
            const isSelected = currentPreset === key;

            return (
              <button
                key={key}
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && set("layoutPreset", key)}
                className={[
                  "relative rounded-lg border-2 p-4 text-left transition-all",
                  isSelected
                    ? "border-gray-900 bg-gray-50"
                    : isLocked
                    ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                    : "border-gray-200 hover:border-gray-400 cursor-pointer",
                ].join(" ")}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <span className="absolute top-3 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900">
                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}

                {/* Lock badge for premium locked */}
                {isLocked && (
                  <span className="absolute top-3 right-3">
                    <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}

                <p className="mb-1 text-sm font-semibold text-gray-900">{meta.label}</p>
                {meta.premium && (
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-amber-600">Premium</p>
                )}
                <p className="text-xs leading-relaxed text-gray-500">{meta.description}</p>
              </button>
            );
          })}
        </div>

        {!premiumLayouts && (
          <p className="mt-4 text-xs text-gray-400">
            Upgrade to the Premium plan to unlock the Editorial and Resort layouts.
          </p>
        )}
      </section>

      {/* Logo */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Logo</h2>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Logo URL (optional)</label>
          <input
            type="url"
            value={form.logo ?? ""}
            onChange={(e) => set("logo", e.target.value)}
            placeholder="https://... (leave blank to show property name as text)"
            className={inputClass}
          />
          {form.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.logo} alt="Logo preview" className="mt-3 h-12 object-contain" />
          )}
        </div>
      </section>

      {/* Section Background Colors */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Color de fondo por sección</h2>
        <p className="mb-5 text-xs text-gray-500">Deja en blanco para usar el color por defecto de cada sección.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(sectionLabels).map(([key, label]) => {
            const currentColor = (form.sectionColors as Record<string, string | undefined> | undefined)?.[key] ?? "";
            return (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentColor || "#ffffff"}
                    onChange={(e) => setSectionColor(key, e.target.value)}
                    className="h-9 w-10 cursor-pointer rounded border border-gray-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={currentColor}
                    onChange={(e) => setSectionColor(key, e.target.value)}
                    placeholder="#ffffff (vacío = por defecto)"
                    className={inputClass}
                  />
                  {currentColor && (
                    <button
                      type="button"
                      onClick={() => setSectionColor(key, "")}
                      className="shrink-0 text-xs text-gray-400 hover:text-gray-700"
                      title="Restablecer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Preview */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Color Preview</h2>
        <div className="flex flex-wrap gap-3">
          <div className="h-12 w-24 rounded-lg" style={{ backgroundColor: form.primaryColor }} />
          <div className="h-12 w-24 rounded-lg" style={{ backgroundColor: form.secondaryColor }} />
          <div className="h-12 w-24 rounded-lg" style={{ backgroundColor: form.accentColor }} />
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-600">Saved!</span>}
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
