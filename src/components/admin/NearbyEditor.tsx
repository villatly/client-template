"use client";

import { useState } from "react";
import type { NearbyAttraction } from "@/lib/types";
import { SaveBar } from "./DescriptionForm";

const inp = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";
const empty: NearbyAttraction = { name: "", description: "", travelTime: "" };

export default function NearbyEditor({ initial }: { initial: NearbyAttraction[] }) {
  const [items, setItems] = useState<NearbyAttraction[]>(initial);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<NearbyAttraction>(empty);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function commitDraft() {
    if (!draft.name.trim()) return;
    setItems(prev => {
      const next = [...prev];
      if (editing === -1) next.push(draft);
      else next[editing!] = draft;
      return next;
    });
    setEditing(null);
    setSaved(false);
  }

  function remove(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)); setSaved(false); }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "nearbyAttractions", data: items }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          {editing === i ? (
            <DraftForm draft={draft} setDraft={setDraft} onCommit={commitDraft} onCancel={() => setEditing(null)} />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  {item.travelTime && <span className="text-xs text-gray-400">{item.travelTime}</span>}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => { setDraft({ ...item }); setEditing(i); }} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-200">Edit</button>
                <button onClick={() => remove(i)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">Remove</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {editing === -1 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <DraftForm draft={draft} setDraft={setDraft} onCommit={commitDraft} onCancel={() => setEditing(null)} />
        </div>
      ) : (
        <button type="button" onClick={() => { setDraft(empty); setEditing(-1); }}
          className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
          + Add Attraction
        </button>
      )}

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}

function DraftForm({ draft, setDraft, onCommit, onCancel }: {
  draft: NearbyAttraction; setDraft: (a: NearbyAttraction) => void; onCommit: () => void; onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Name *" className={inp} />
        <input value={draft.travelTime ?? ""} onChange={e => setDraft({ ...draft, travelTime: e.target.value })} placeholder="Travel time (e.g. 10 min)" className={inp} />
      </div>
      <textarea rows={3} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}
        placeholder="Description" className={`${inp} resize-y`} />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="rounded-md px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-100">Cancel</button>
        <button type="button" onClick={onCommit} className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700">Save</button>
      </div>
    </div>
  );
}
