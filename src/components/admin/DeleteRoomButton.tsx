"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteRoomButton({ roomId, roomName }: { roomId: string; roomName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${roomName}"? This cannot be undone.`)) return;
    setLoading(true);
    await fetch(`/api/admin/rooms/${roomId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
    >
      {loading ? "..." : "Delete"}
    </button>
  );
}
