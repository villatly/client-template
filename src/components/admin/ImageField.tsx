"use client";

import { useRef, useState } from "react";

interface ImageFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
}

/**
 * Reusable image field for admin forms.
 * Supports URL paste + file upload (via /api/admin/upload).
 * Shows a live preview and a remove button.
 */
export default function ImageField({ label, hint, value, onChange }: ImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-700">
        {label}
        {hint && <span className="ml-1 text-gray-400 font-normal">{hint}</span>}
      </label>

      {/* Preview */}
      {value && (
        <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50" style={{ aspectRatio: "16/7" }}>
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-black/80 transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {/* URL input */}
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://... or upload below"
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />

      {/* Upload button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {uploading ? "Uploading…" : "Upload image"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}
