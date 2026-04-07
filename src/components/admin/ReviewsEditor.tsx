"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";
import { SaveBar } from "./DescriptionForm";

const inp = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

const empty: Review = { author: "", text: "", rating: 5, country: "" };

export default function ReviewsEditor({ initial }: { initial: Review[] }) {
  const [items, setItems] = useState<Review[]>(initial);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Review>(empty);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function startAdd() { setDraft(empty); setEditing(-1); }
  function startEdit(i: number) { setDraft({ ...items[i] }); setEditing(i); }

  function commitDraft() {
    if (!draft.author.trim() || !draft.text.trim()) return;
    setItems(prev => {
      const next = [...prev];
      if (editing === -1) next.push(draft);
      else next[editing!] = draft;
      return next;
    });
    setEditing(null);
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
      body: JSON.stringify({ section: "reviews", data: items }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      {items.map((r, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          {editing === i ? (
            <ReviewDraftForm draft={draft} setDraft={setDraft} onCommit={commitDraft} onCancel={() => setEditing(null)} />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{r.author}</span>
                  {r.country && <span className="text-xs text-gray-400">{r.country}</span>}
                  <span className="text-xs text-amber-500">{"★".repeat(r.rating)}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{r.text}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => startEdit(i)} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-200">Edit</button>
                <button onClick={() => remove(i)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">Remove</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {editing === -1 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <ReviewDraftForm draft={draft} setDraft={setDraft} onCommit={commitDraft} onCancel={() => setEditing(null)} />
        </div>
      ) : (
        <button type="button" onClick={startAdd}
          className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
          + Add Review
        </button>
      )}

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}

function ReviewDraftForm({ draft, setDraft, onCommit, onCancel }: {
  draft: Review; setDraft: (r: Review) => void; onCommit: () => void; onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <input value={draft.author} onChange={e => setDraft({ ...draft, author: e.target.value })} placeholder="Author name *" className={inp} />
        <input value={draft.country ?? ""} onChange={e => setDraft({ ...draft, country: e.target.value })} placeholder="Country (optional)" className={inp} />
        <select value={draft.rating} onChange={e => setDraft({ ...draft, rating: Number(e.target.value) })} className={inp}>
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>)}
        </select>
      </div>
      <textarea rows={3} value={draft.text} onChange={e => setDraft({ ...draft, text: e.target.value })} placeholder="Review text *"
        className={`${inp} resize-y`} />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="rounded-md px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-100">Cancel</button>
        <button type="button" onClick={onCommit} className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700">
          Save Review
        </button>
      </div>
    </div>
  );
}
