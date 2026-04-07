"use client";

import { useState } from "react";
import type { PoliciesContent } from "@/lib/types";
import { SaveBar } from "./DescriptionForm";

const inp = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

export default function PoliciesForm({ initial }: { initial: PoliciesContent }) {
  const [form, setForm] = useState(initial);
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof PoliciesContent>(k: K, v: PoliciesContent[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setSaved(false);
  }

  function addNote() {
    const note = noteInput.trim();
    if (!note) return;
    set("notes", [...(form.notes ?? []), note]);
    setNoteInput("");
  }

  function removeNote(i: number) {
    set("notes", form.notes.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "policies", data: form }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Check-in time</label>
          <input value={form.checkIn} onChange={e => set("checkIn", e.target.value)} placeholder="e.g. 15:00" className={inp} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Check-out time</label>
          <input value={form.checkOut} onChange={e => set("checkOut", e.target.value)} placeholder="e.g. 11:00" className={inp} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Cancellation Policy</label>
        <textarea rows={3} value={form.cancellation} onChange={e => set("cancellation", e.target.value)}
          placeholder="Describe the cancellation policy…" className={`${inp} resize-y`} />
      </div>
      <div>
        <label className="mb-2 block text-xs font-medium text-gray-700">Additional Notes</label>
        <div className="flex gap-2 mb-3">
          <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addNote(); } }}
            placeholder="e.g. No smoking on premises" className={inp} />
          <button type="button" onClick={addNote}
            className="shrink-0 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Add</button>
        </div>
        <ul className="space-y-1.5">
          {(form.notes ?? []).map((note, i) => (
            <li key={i} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 border border-gray-100 px-3 py-2 text-sm text-gray-700">
              {note}
              <button type="button" onClick={() => removeNote(i)} className="shrink-0 text-red-400 hover:text-red-600">&times;</button>
            </li>
          ))}
        </ul>
      </div>
      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
