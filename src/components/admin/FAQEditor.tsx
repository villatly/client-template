"use client";

import { useState } from "react";
import type { FAQItem } from "@/lib/types";
import { SaveBar } from "./DescriptionForm";

const inp = "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

export default function FAQEditor({ initial }: { initial: FAQItem[] }) {
  const [items, setItems] = useState<FAQItem[]>(initial);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<FAQItem>({ question: "", answer: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function startAdd() { setDraft({ question: "", answer: "" }); setEditing(-1); }
  function startEdit(i: number) { setDraft({ ...items[i] }); setEditing(i); }

  function commitDraft() {
    if (!draft.question.trim() || !draft.answer.trim()) return;
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
      body: JSON.stringify({ section: "faq", data: items }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          {editing === i ? (
            <FAQDraftForm draft={draft} setDraft={setDraft} onCommit={commitDraft} onCancel={() => setEditing(null)} />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-0.5">{item.question}</p>
                <p className="text-sm text-gray-500 line-clamp-2">{item.answer}</p>
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
          <FAQDraftForm draft={draft} setDraft={setDraft} onCommit={commitDraft} onCancel={() => setEditing(null)} />
        </div>
      ) : (
        <button type="button" onClick={startAdd}
          className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
          + Add FAQ Item
        </button>
      )}

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}

function FAQDraftForm({ draft, setDraft, onCommit, onCancel }: {
  draft: FAQItem; setDraft: (f: FAQItem) => void; onCommit: () => void; onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <input value={draft.question} onChange={e => setDraft({ ...draft, question: e.target.value })} placeholder="Question *" className={inp} />
      <textarea rows={4} value={draft.answer} onChange={e => setDraft({ ...draft, answer: e.target.value })} placeholder="Answer *"
        className={`${inp} resize-y`} />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="rounded-md px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-100">Cancel</button>
        <button type="button" onClick={onCommit} className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700">
          Save Item
        </button>
      </div>
    </div>
  );
}
