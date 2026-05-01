"use client";

import { useState } from "react";

interface Section {
  id: string;
  label: string;
  sub?: string;
  form: React.ReactNode;
}

export default function Accordion({ sections }: { sections: Section[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm">
      {sections.map((s) => (
        <div key={s.id}>
          <button
            type="button"
            onClick={() => setOpen(open === s.id ? null : s.id)}
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">{s.label}</p>
              {s.sub && (
                <p className="mt-0.5 text-xs text-gray-400 truncate max-w-sm">{s.sub}</p>
              )}
            </div>
            <svg
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open === s.id ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`border-t border-gray-100 px-5 py-5 ${open === s.id ? "" : "hidden"}`}>
            {s.form}
          </div>
        </div>
      ))}
    </div>
  );
}
