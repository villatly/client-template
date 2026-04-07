"use client";

/**
 * ICalManager — admin UI for external iCal calendar synchronisation.
 *
 * Shown when booking.mode === "external".
 *
 * Per room / per unit:
 *   EXPORT — copy the URL of our iCal feed; paste it into Airbnb / Booking.com
 *            so they block the same dates on their side.
 *   IMPORT — paste Airbnb / Booking.com iCal URLs here; we fetch + parse them
 *            and store the blocked dates so our calendar stays accurate.
 *   SYNC   — trigger a manual re-fetch of all import sources.
 */

import { useState, useCallback, useEffect } from "react";
import type { AvailabilityData, ICalSyncSource, RoomUnit } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins   = Math.round(diffMs / 60_000);
  if (mins < 2)   return "just now";
  if (mins < 60)  return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days  = Math.round(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

const PLATFORM_HINTS: Record<string, string> = {
  "Airbnb":       "In Airbnb: Calendar → Availability settings → Export calendar",
  "Booking.com":  "In Booking.com: Calendar → iCal → Export URL",
  "VRBO":         "In VRBO: Calendar → Export calendar",
  "Agoda":        "In Agoda: Calendar → Sync calendars → Export",
};

const PLATFORM_OPTIONS = ["Airbnb", "Booking.com", "VRBO", "Agoda", "Other"];

// ─── SyncBadge ────────────────────────────────────────────────────────────────

function SyncBadge({ source }: { source: ICalSyncSource }) {
  if (!source.lastSyncStatus || source.lastSyncStatus === "never") {
    return <span className="text-[10px] text-gray-400 italic">Not yet synced</span>;
  }
  if (source.lastSyncStatus === "error") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-red-600 font-medium" title={source.lastSyncError}>
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
        Sync failed — {source.lastSyncedAt ? relativeTime(source.lastSyncedAt) : ""}
      </span>
    );
  }
  if (source.lastSyncStatus === "empty_warning") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium" title={source.lastSyncError}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
        Empty feed warning
      </span>
    );
  }
  if (isSourceStale(source)) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
        Stale — last synced {source.lastSyncedAt ? relativeTime(source.lastSyncedAt) : ""}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
      Synced {source.lastSyncedAt ? relativeTime(source.lastSyncedAt) : ""}
    </span>
  );
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
    >
      {copied ? "Copied ✓" : "Copy URL"}
    </button>
  );
}

// ─── AddSourceForm ────────────────────────────────────────────────────────────

function AddSourceForm({
  onAdd,
  onCancel,
}: {
  onAdd: (label: string, url: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("Airbnb");
  const [customLabel, setCustomLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const effectiveLabel = label === "Other" ? customLabel : label;
  const hint = label !== "Other" ? PLATFORM_HINTS[label] : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveLabel.trim()) { setError("Please enter a platform name."); return; }
    if (!url.trim()) { setError("Please enter the iCal URL."); return; }
    if (!url.startsWith("http") && !url.startsWith("webcal")) {
      setError("URL must start with https:// or webcal://");
      return;
    }
    onAdd(effectiveLabel.trim(), url.trim());
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-700">Add calendar source</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Platform</label>
          <select
            value={label}
            onChange={e => setLabel(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          >
            {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {label === "Other" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
            <input
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              placeholder="e.g. HomeAway"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">iCal URL</label>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://  or  webcal://"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none font-mono text-xs"
        />
        {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors">
          Add source
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── UnitICalPanel ────────────────────────────────────────────────────────────

function UnitICalPanel({
  roomId,
  unitId,
  showUnitLabel,
  sources,
  blockedRanges,
  exportBaseUrl,
  onSourcesChange,
  onSyncUnit,
}: {
  roomId: string;
  unitId: string;
  showUnitLabel: boolean;
  sources: ICalSyncSource[];
  blockedRanges: { from: string; to: string; icalSourceId?: string; icalSummary?: string }[];
  exportBaseUrl: string;
  onSourcesChange: (sources: ICalSyncSource[]) => void;
  onSyncUnit: (unitId: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const exportUrl = `${exportBaseUrl}/api/calendar/${roomId}${showUnitLabel ? `?unit=${unitId}` : ""}`;

  // Upcoming imported blocked ranges (next 90 days)
  const todayStr = new Date().toISOString().split("T")[0];
  const cutoff   = new Date(); cutoff.setUTCDate(cutoff.getUTCDate() + 90);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const importedBlocks = blockedRanges
    .filter(r => r.icalSourceId && r.to >= todayStr && r.from <= cutoffStr)
    .sort((a, b) => a.from.localeCompare(b.from))
    .slice(0, 10);

  function addSource(label: string, url: string) {
    const newSource: ICalSyncSource = {
      id: crypto.randomUUID(),
      label,
      url,
      lastSyncStatus: "never",
    };
    onSourcesChange([...sources, newSource]);
    setShowAddForm(false);
  }

  function removeSource(id: string) {
    onSourcesChange(sources.filter(s => s.id !== id));
    setConfirmRemove(null);
  }

  const health = unitHealthStatus(sources);

  return (
    <div className="space-y-4">
      {showUnitLabel && (
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full shrink-0 ${
            health === "ok"    ? "bg-emerald-400" :
            health === "error" ? "bg-red-400" :
            health === "stale" ? "bg-amber-400" :
            "bg-gray-300"
          }`} />
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Unit: {unitId}
          </p>
        </div>
      )}

      {/* Export section */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-800 mb-1">Your iCal export URL</p>
        <p className="text-[11px] text-blue-600 mb-2">
          Copy this URL into Airbnb / Booking.com to sync your blocked dates to their platform.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 min-w-0 truncate rounded-md bg-white border border-blue-200 px-2.5 py-1.5 text-[11px] font-mono text-blue-900">
            {exportUrl}
          </code>
          <CopyButton text={exportUrl} />
        </div>
        <p className="mt-2 text-[10px] text-blue-500">
          In Airbnb: Calendar → Availability settings → Import calendar → paste this URL.
          In Booking.com: Calendar → iCal → Import URL.
        </p>
      </div>

      {/* Import sources */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-700">Import sources</p>
          {sources.length > 0 && (
            <button
              onClick={() => onSyncUnit(unitId)}
              className="text-[11px] text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sync all →
            </button>
          )}
        </div>

        {sources.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            No import sources yet. Add your Airbnb or Booking.com iCal URL below.
          </p>
        ) : (
          <div className="space-y-2">
            {sources.map(src => (
              <div key={src.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-800">{src.label}</span>
                      <SyncBadge source={src} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{src.url}</p>
                    {src.lastSyncStatus === "error" && src.lastSyncError && (
                      <p className="mt-1 text-[10px] text-red-600 bg-red-50 rounded px-2 py-0.5">
                        {src.lastSyncError}
                      </p>
                    )}
                    {src.lastSyncStatus === "empty_warning" && src.lastSyncError && (
                      <p className="mt-1 text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-0.5">
                        {src.lastSyncError} If the calendar is intentionally empty, remove and re-add this source.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {confirmRemove === src.id ? (
                      <>
                        <button onClick={() => removeSource(src.id)}
                          className="text-[10px] text-red-600 hover:text-red-800 font-medium">Remove</button>
                        <button onClick={() => setConfirmRemove(null)}
                          className="text-[10px] text-gray-400 hover:text-gray-700 ml-1">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmRemove(src.id)}
                        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddForm ? (
          <AddSourceForm onAdd={addSource} onCancel={() => setShowAddForm(false)} />
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add calendar source
          </button>
        )}
      </div>

      {/* Imported blocked dates (upcoming) */}
      {importedBlocks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Imported blocks — next 90 days ({importedBlocks.length} shown)
          </p>
          <div className="space-y-1">
            {importedBlocks.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                <span className="text-gray-600">
                  {fmtDate(r.from)} — {fmtDate(r.to)}
                </span>
                <span className="text-[10px] text-gray-400">
                  {r.icalSummary ?? "Blocked"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Auto-sync if any source hasn't been synced in this many milliseconds */
const AUTO_SYNC_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Show amber "Stale" badge if a successful sync is older than this */
const STALE_WARN_MS = 12 * 60 * 60 * 1000; // 12 hours

// ─── Health helpers ───────────────────────────────────────────────────────────

function isSourceStale(source: ICalSyncSource): boolean {
  if (source.lastSyncStatus !== "ok" || !source.lastSyncedAt) return false;
  return Date.now() - new Date(source.lastSyncedAt).getTime() > STALE_WARN_MS;
}

function unitHealthStatus(sources: ICalSyncSource[]): "ok" | "stale" | "error" | "empty" {
  if (sources.length === 0) return "empty";
  if (sources.some(s => s.lastSyncStatus === "error")) return "error";
  if (sources.some(s => s.lastSyncStatus === "empty_warning" || isSourceStale(s))) return "stale";
  if (sources.every(s => !s.lastSyncStatus || s.lastSyncStatus === "never")) return "stale";
  return "ok";
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SyncResult {
  sourceId: string;
  sourceLabel: string;
  unitId: string;
  status: "ok" | "error" | "empty_warning";
  eventsImported?: number;
  emptyWarning?: boolean;
  error?: string;
}

export default function ICalManager({
  initial,
  rooms,
}: {
  initial: AvailabilityData;
  rooms: RoomUnit[];
}) {
  const [avail, setAvail]       = useState<AvailabilityData>(initial);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [syncing, setSyncing]   = useState(false);
  const [autoSynced, setAutoSynced] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);
  const [syncError, setSyncError]     = useState<string | null>(null);

  // Base URL for building export URLs (client-side)
  const [origin, setOrigin] = useState("https://your-site.com");
  if (typeof window !== "undefined" && origin === "https://your-site.com") {
    setOrigin(window.location.origin);
  }

  // Update icalSources for a specific unit and auto-save
  const handleSourcesChange = useCallback(
    async (roomId: string, unitId: string, sources: ICalSyncSource[]) => {
      const updated: AvailabilityData = {
        ...avail,
        [roomId]: {
          ...avail[roomId],
          units: avail[roomId].units.map((u) =>
            u.id === unitId ? { ...u, icalSources: sources } : u
          ),
        },
      };
      setAvail(updated);
      setSaved(false);
      setSaving(true);
      await fetch("/api/admin/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    [avail]
  );

  // Sync a specific unit (or all). Pass silent=true to suppress result display.
  const syncUnits = useCallback(async (unitId?: string, silent = false) => {
    setSyncing(true);
    if (!silent) { setSyncResults(null); setSyncError(null); }
    try {
      const res = await fetch("/api/admin/ical/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unitId ? { unitId } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        if (!silent) setSyncError("Sync failed. Please try again.");
        return;
      }
      if (!silent) setSyncResults(data.results ?? []);

      // Refresh local availability state (sync updates blockedRanges)
      const refreshRes = await fetch("/api/admin/availability");
      if (refreshRes.ok) {
        const fresh = await refreshRes.json();
        setAvail(fresh);
      }
    } catch {
      if (!silent) setSyncError("Network error during sync.");
    } finally {
      setSyncing(false);
    }
  }, []);

  // Auto-sync on mount if any source is stale (never synced or >2 hours ago)
  useEffect(() => {
    const allSources = Object.values(avail)
      .flatMap(r => r.units)
      .flatMap(u => u.icalSources ?? []);
    if (allSources.length === 0) return;

    const hasStale = allSources.some(s => {
      if (!s.lastSyncedAt || s.lastSyncStatus === "never") return true;
      return Date.now() - new Date(s.lastSyncedAt).getTime() > AUTO_SYNC_THRESHOLD_MS;
    });

    if (hasStale && !autoSynced) {
      setAutoSynced(true);
      syncUnits(undefined, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roomsWithAvail = rooms.filter(r => avail[r.id]);
  const allSources      = Object.values(avail).flatMap(r => r.units).flatMap(u => u.icalSources ?? []);
  const totalSources    = allSources.length;
  const errorSources    = allSources.filter(s => s.lastSyncStatus === "error");
  const staleSources    = allSources.filter(s => isSourceStale(s));
  const warningSources  = allSources.filter(s => s.lastSyncStatus === "empty_warning");
  const neverSources    = allSources.filter(s => !s.lastSyncStatus || s.lastSyncStatus === "never");

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">
              {totalSources === 0
                ? "No import sources configured yet."
                : `${totalSources} import source${totalSources !== 1 ? "s" : ""} configured.`}
            </p>
            {totalSources > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {syncing ? "Syncing…" : "Auto-syncs every 2 hours"}
              </span>
            )}
          </div>
          {(saving || saved) && (
            <p className={`text-xs mt-0.5 ${saved ? "text-emerald-600" : "text-gray-400"}`}>
              {saving ? "Saving…" : "Saved ✓"}
            </p>
          )}
        </div>
        <button
          onClick={() => syncUnits()}
          disabled={syncing || totalSources === 0}
          className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          {syncing ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
              Syncing…
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync now
            </>
          )}
        </button>
      </div>

      {/* Health warning banner */}
      {totalSources > 0 && (errorSources.length > 0 || staleSources.length > 0 || warningSources.length > 0) && !syncing && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="text-xs text-amber-800">
              {errorSources.length > 0 && (
                <p className="font-semibold">
                  {errorSources.length} source{errorSources.length !== 1 ? "s" : ""} failed to sync:{" "}
                  {errorSources.map(s => s.label).join(", ")}.
                </p>
              )}
              {warningSources.length > 0 && (
                <p className={errorSources.length > 0 ? "mt-0.5 font-semibold" : "font-semibold"}>
                  {warningSources.length} source{warningSources.length !== 1 ? "s" : ""} returned an empty feed —{" "}
                  previous blocks preserved as a safety measure.
                </p>
              )}
              {staleSources.length > 0 && (
                <p className={errorSources.length > 0 || warningSources.length > 0 ? "mt-0.5" : "font-semibold"}>
                  {staleSources.length} source{staleSources.length !== 1 ? "s" : ""} not synced in over 12 hours.
                </p>
              )}
              <p className="mt-1 text-amber-700">
                {warningSources.length > 0
                  ? "Blocked dates are preserved until the feed returns data. If the calendar is intentionally empty, remove and re-add the source."
                  : "Calendar data may be out of date. Click \"Sync now\" to refresh, or check that source URLs are still valid."
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* First-time guidance: sources added but never synced */}
      {neverSources.length > 0 && neverSources.length === totalSources && !syncing && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          <p className="font-semibold">Sources added — first sync pending</p>
          <p className="mt-0.5 text-blue-700">
            Your calendar sources have been saved. They will sync automatically within 2 hours,
            or click &quot;Sync now&quot; to import blocked dates immediately.
          </p>
        </div>
      )}

      {/* Sync results */}
      {syncResults !== null && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          syncResults.every(r => r.status === "ok")
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}>
          {syncResults.length === 0 ? (
            <p>No sources to sync.</p>
          ) : (
            <ul className="space-y-1">
              {syncResults.map((r, i) => (
                <li key={i} className="text-xs flex items-start gap-2">
                  <span className={`mt-px ${r.status === "ok" ? "text-emerald-600" : r.status === "empty_warning" ? "text-amber-600" : "text-red-600"}`}>
                    {r.status === "ok" ? "✓" : r.status === "empty_warning" ? "⚠" : "✗"}
                  </span>
                  <span>
                    <span className="font-medium">{r.sourceLabel}</span>
                    <span className="text-gray-500 ml-1">({r.unitId})</span>
                    {r.status === "ok" && (
                      <span className="ml-1">— {r.eventsImported} event{r.eventsImported !== 1 ? "s" : ""} imported</span>
                    )}
                    {r.status === "empty_warning" && (
                      <span className="ml-1 text-amber-700">— feed empty, previous blocks preserved</span>
                    )}
                    {r.status === "error" && (
                      <span className="ml-1 text-red-600">— {r.error}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {syncError && (
        <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{syncError}</p>
      )}

      {/* How it works */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-xs font-semibold text-gray-700 mb-2">How calendar sync works</p>
        <ol className="space-y-1.5 text-xs text-gray-500 list-decimal list-inside">
          <li>
            <strong>Export (our → platform):</strong> Copy the export URL for each room and paste it into Airbnb or
            Booking.com. They will periodically fetch it and block the same dates on their calendars.
          </li>
          <li>
            <strong>Import (platform → us):</strong> Paste the iCal URL from Airbnb / Booking.com as an import source
            below. Blocked dates are pulled into our calendar automatically — no manual action needed.
          </li>
          <li>
            <strong>Automatic sync:</strong> When deployed on Vercel, a cron job runs every 2 hours and refreshes all
            import sources. This page also triggers a background sync on load if any source is stale.
            Use &quot;Sync now&quot; only as a manual override.
          </li>
        </ol>
        <p className="mt-3 text-[11px] text-gray-400">
          Note: iCal is not real-time. A window of up to 2 hours exists between a booking on one platform and it
          appearing here. For high-occupancy periods, use &quot;Sync now&quot; before confirming new reservations.
        </p>
      </div>

      {/* Per-room panels */}
      {roomsWithAvail.map((room) => {
        const roomData  = avail[room.id];
        const multiUnit = roomData.units.length > 1;

        return (
          <div key={room.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{room.name}</h3>
                {multiUnit && (
                  <p className="text-xs text-gray-400 mt-0.5">{roomData.units.length} units</p>
                )}
              </div>
            </div>

            <div className={`p-5 ${multiUnit ? "space-y-6 divide-y divide-gray-100" : ""}`}>
              {roomData.units.map((unit, idx) => (
                <div key={unit.id} className={multiUnit && idx > 0 ? "pt-6" : ""}>
                  <UnitICalPanel
                    roomId={room.id}
                    unitId={unit.id}
                    showUnitLabel={multiUnit}
                    sources={unit.icalSources ?? []}
                    blockedRanges={unit.blockedRanges}
                    exportBaseUrl={origin}
                    onSourcesChange={(sources) => handleSourcesChange(room.id, unit.id, sources)}
                    onSyncUnit={() => syncUnits(unit.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {roomsWithAvail.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-400">No rooms configured yet.</p>
          <p className="text-xs text-gray-400 mt-1">Add rooms in the Rooms section first.</p>
        </div>
      )}
    </div>
  );
}
