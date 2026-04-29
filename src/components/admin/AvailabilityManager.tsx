"use client";

import { useState, useCallback } from "react";
import type {
  AvailabilityData,
  RoomAvailability,
  RoomUnitAvailability,
  BlockedRange,
  PricePeriod,
  RoomUnit,
} from "@/lib/types";

// ─── Calendar helpers ─────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function toStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function calendarCells(y: number, m: number): (number | null)[] {
  const first = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

function isBlocked(date: string, ranges: BlockedRange[]) {
  return ranges.some((r) => date >= r.from && date <= r.to);
}

function getPricePeriodIdx(date: string, periods: PricePeriod[]) {
  return periods.findIndex((p) => date >= p.from && date <= p.to);
}

function inSelRange(date: string, a: string | null, b: string | null) {
  if (!a || !b) return false;
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return date >= lo && date <= hi;
}

function nightsBetween(from: string, to: string) {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1;
}

const PERIOD_COLORS = [
  { cell: "bg-amber-100 text-amber-800",  badge: "bg-amber-200 text-amber-900",  dot: "bg-amber-400" },
  { cell: "bg-sky-100 text-sky-800",      badge: "bg-sky-200 text-sky-900",      dot: "bg-sky-400"   },
  { cell: "bg-violet-100 text-violet-800",badge: "bg-violet-200 text-violet-900",dot: "bg-violet-400"},
  { cell: "bg-emerald-100 text-emerald-800",badge:"bg-emerald-200 text-emerald-900",dot:"bg-emerald-400"},
  { cell: "bg-pink-100 text-pink-800",    badge: "bg-pink-200 text-pink-900",    dot: "bg-pink-400"  },
];

const inp = "rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

// ─── Stats Panel ──────────────────────────────────────────────────────────────

function StatsPanel({ unit, rd, currency }: { unit: RoomUnitAvailability; rd: RoomAvailability; currency: string }) {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const y = now.getFullYear();
  const m = now.getMonth();
  const totalDays = new Date(y, m + 1, 0).getDate();
  const curDay = now.getDate();

  let avail = 0, blocked = 0, revenue = 0;
  for (let d = curDay; d <= totalDays; d++) {
    const ds = toStr(y, m, d);
    if (isBlocked(ds, unit.blockedRanges)) {
      blocked++;
    } else {
      avail++;
      const pi = getPricePeriodIdx(ds, rd.pricePeriods);
      revenue += pi >= 0 ? rd.pricePeriods[pi].pricePerNight : rd.pricePerNight;
    }
  }

  const upcoming = unit.blockedRanges
    .filter((r) => r.to >= todayStr)
    .sort((a, b) => a.from.localeCompare(b.from))[0];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
      <div className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Available this month</p>
        <p className="text-2xl font-bold text-emerald-600">{avail}</p>
        <p className="text-xs text-gray-400 mt-0.5">nights remaining</p>
      </div>
      <div className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Blocked this month</p>
        <p className="text-2xl font-bold text-rose-500">{blocked}</p>
        <p className="text-xs text-gray-400 mt-0.5">nights blocked</p>
      </div>
      <div className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Revenue potential</p>
        <p className="text-2xl font-bold text-gray-900">{currency} {revenue.toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-0.5">at current rates</p>
      </div>
      <div className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Next reservation</p>
        {upcoming ? (
          <>
            <p className="text-sm font-semibold text-gray-900">{upcoming.from}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {upcoming.from === upcoming.to ? "1 night" : `${nightsBetween(upcoming.from, upcoming.to)} nights`}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400 mt-1">None upcoming</p>
        )}
      </div>
    </div>
  );
}

// ─── Calendar (operates on a single unit's blockedRanges) ─────────────────────

interface CalendarProps {
  unit: RoomUnitAvailability;
  rd: RoomAvailability;
  onBlock: (from: string, to: string) => void;
  onUnblock: (from: string, to: string) => void;
}

function Calendar({ unit, rd, onBlock, onUnblock }: CalendarProps) {
  const now = new Date();
  const [viewY, setViewY] = useState(now.getFullYear());
  const [viewM, setViewM] = useState(now.getMonth());
  const [selA, setSelA] = useState<string | null>(null);
  const [selB, setSelB] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const todayStr = now.toISOString().split("T")[0];
  const cells = calendarCells(viewY, viewM);

  function prevMonth() {
    if (viewM === 0) { setViewY(y => y - 1); setViewM(11); }
    else setViewM(m => m - 1);
  }
  function nextMonth() {
    if (viewM === 11) { setViewY(y => y + 1); setViewM(0); }
    else setViewM(m => m + 1);
  }

  function handleDayClick(ds: string) {
    if (ds < todayStr) return;
    if (!selA) {
      setSelA(ds); setSelB(null);
    } else if (!selB) {
      if (ds === selA) { setSelA(null); return; }
      setSelB(ds); setHover(null);
    } else {
      setSelA(ds); setSelB(null); setHover(null);
    }
  }

  const [lo, hi] = selA && selB
    ? (selA <= selB ? [selA, selB] : [selB, selA])
    : [null, null];

  const selNights = lo && hi ? nightsBetween(lo, hi) : 0;
  const anyBlocked = lo && hi
    ? unit.blockedRanges.some((r) => !(hi < r.from || lo > r.to))
    : false;

  function cellClass(ds: string, d: number | null) {
    if (!d) return "";
    const past = ds < todayStr;
    const today = ds === todayStr;
    const blocked = isBlocked(ds, unit.blockedRanges);
    const pIdx = getPricePeriodIdx(ds, rd.pricePeriods);
    const inSel = inSelRange(ds, selA, selB ?? (selA ? hover : null));
    const isEndpoint = ds === selA || ds === (selB ?? hover);

    if (past) return "text-gray-300 cursor-default";
    if (inSel || isEndpoint) return `${isEndpoint ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-800"} cursor-pointer rounded-md font-medium${today ? " ring-2 ring-offset-1 ring-gray-900" : ""}`;
    if (blocked) return `bg-rose-100 text-rose-700 rounded-md cursor-pointer hover:bg-rose-200${today ? " ring-2 ring-offset-1 ring-rose-400" : ""}`;
    if (pIdx >= 0) return `${PERIOD_COLORS[pIdx % PERIOD_COLORS.length].cell} rounded-md cursor-pointer hover:opacity-80${today ? " ring-2 ring-offset-1 ring-current" : ""}`;
    return `text-gray-700 rounded-md cursor-pointer hover:bg-gray-100${today ? " ring-2 ring-offset-1 ring-gray-400 font-semibold" : ""}`;
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="rounded-md p-1.5 hover:bg-gray-100 transition-colors">
          <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-sm font-semibold text-gray-900">{MONTHS[viewM]} {viewY}</h3>
        <button onClick={nextMonth} className="rounded-md p-1.5 hover:bg-gray-100 transition-colors">
          <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-[11px]">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-200" />Blocked</span>
        {rd.pricePeriods.map((p, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded ${PERIOD_COLORS[i % PERIOD_COLORS.length].dot}`} />
            {p.label || `Period ${i + 1}`}
          </span>
        ))}
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-white border border-gray-300" />Available</span>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = toStr(viewY, viewM, d);
          return (
            <div
              key={i}
              onClick={() => handleDayClick(ds)}
              onMouseEnter={() => selA && !selB && setHover(ds)}
              onMouseLeave={() => setHover(null)}
              className={`relative flex aspect-square items-center justify-center text-xs transition-colors ${cellClass(ds, d)}`}
            >
              {d}
              {isBlocked(ds, unit.blockedRanges) && ds >= todayStr && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-rose-400" />
              )}
            </div>
          );
        })}
      </div>

      {!selA && (
        <p className="mt-3 text-center text-[11px] text-gray-400">Click a date to start selecting a range</p>
      )}
      {selA && !selB && (
        <p className="mt-3 text-center text-[11px] text-gray-400">Click a second date to complete the range</p>
      )}

      {lo && hi && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
          <span className="text-sm text-gray-700">
            <span className="font-semibold">{lo === hi ? lo : `${lo} → ${hi}`}</span>
            <span className="text-gray-400 ml-2">({selNights} {selNights === 1 ? "night" : "nights"})</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { onBlock(lo, hi); setSelA(null); setSelB(null); }}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 transition-colors"
            >
              Block
            </button>
            {anyBlocked && (
              <button
                onClick={() => { onUnblock(lo, hi); setSelA(null); setSelB(null); }}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Unblock
              </button>
            )}
            <button
              onClick={() => { setSelA(null); setSelB(null); }}
              className="rounded-md bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Blocked periods list ─────────────────────────────────────────────────────

function BlockedList({ unit, rd, onRemove, currency }: {
  unit: RoomUnitAvailability;
  rd: RoomAvailability;
  onRemove: (i: number) => void;
  currency: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const sorted = [...unit.blockedRanges]
    .map((r, i) => ({ ...r, origIdx: i }))
    .sort((a, b) => a.from.localeCompare(b.from));

  if (sorted.length === 0) return <p className="text-sm text-gray-400">No blocked periods. Use the calendar above to block dates manually, or confirm a booking to block automatically.</p>;

  return (
    <ul className="space-y-2">
      {sorted.map((range) => {
        const { from, to, origIdx, bookingId, icalSourceId, icalSummary } = range;
        const nights = nightsBetween(from, to);
        const isPast = to < today;
        const isActive = from <= today && to >= today;
        const isBooking = !!bookingId;
        const isIcal = !!icalSourceId;

        let rev = 0;
        for (let d = 0; d < nights; d++) {
          const dt = new Date(from);
          dt.setDate(dt.getDate() + d);
          const ds = dt.toISOString().split("T")[0];
          const pi = getPricePeriodIdx(ds, rd.pricePeriods);
          rev += pi >= 0 ? rd.pricePeriods[pi].pricePerNight : rd.pricePerNight;
        }

        const source = isBooking
          ? { label: "Booking", cls: "bg-emerald-100 text-emerald-700" }
          : isIcal
          ? { label: icalSummary ?? "iCal", cls: "bg-sky-100 text-sky-700" }
          : { label: "Manual", cls: "bg-gray-100 text-gray-600" };

        return (
          <li key={origIdx} className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 ${isPast ? "border-gray-200 bg-gray-50 opacity-60" : isActive ? "border-blue-200 bg-blue-50" : "border-rose-200 bg-rose-50"}`}>
            <div className="flex items-start gap-3 min-w-0">
              <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${isPast ? "bg-gray-400" : isActive ? "bg-blue-500" : "bg-rose-400"}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {from === to ? from : `${from} → ${to}`}
                </p>
                <p className="text-xs text-gray-500">
                  {nights} {nights === 1 ? "night" : "nights"}
                  {!isPast && <span className="ml-2 text-gray-400">· Est. {currency} {rev.toLocaleString()}</span>}
                </p>
                {isBooking && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Booking ID: <span className="font-mono">{bookingId!.slice(0, 8)}…</span>
                    {" · "}
                    <span className="text-amber-600">Removing this does NOT cancel the booking</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${source.cls}`}>
                {source.label}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isPast ? "bg-gray-200 text-gray-600" : isActive ? "bg-blue-200 text-blue-700" : "bg-rose-200 text-rose-700"}`}>
                {isPast ? "Past" : isActive ? "Active now" : "Upcoming"}
              </span>
              {!isPast && (
                <button
                  onClick={() => onRemove(origIdx)}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors ml-1"
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Price periods panel ──────────────────────────────────────────────────────

function PricePeriodsPanel({ rd, onChange, currency }: {
  rd: RoomAvailability;
  onChange: (periods: PricePeriod[]) => void;
  currency: string;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [price, setPrice] = useState("");
  const [label, setLabel] = useState("");

  const today = new Date().toISOString().split("T")[0];

  function add() {
    if (!from || !to || from > to || !price) return;
    const updated = [...rd.pricePeriods, { from, to, pricePerNight: Number(price), label: label || undefined }]
      .sort((a, b) => a.from.localeCompare(b.from));
    onChange(updated);
    setFrom(""); setTo(""); setPrice(""); setLabel("");
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-gray-900">Price Periods</h3>
      <p className="mb-4 text-xs text-gray-400">Override the base price for specific date ranges. Applies to all units of this room type.</p>

      {rd.pricePeriods.length > 0 && (
        <ul className="mb-4 space-y-2">
          {rd.pricePeriods.map((p, i) => {
            const colors = PERIOD_COLORS[i % PERIOD_COLORS.length];
            return (
              <li key={i} className={`flex items-center justify-between rounded-md px-3 py-2.5 border ${colors.badge}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                  <div>
                    <span className="text-xs font-semibold">{p.label || `Period ${i + 1}`}</span>
                    <span className="text-xs opacity-70 ml-2">{p.from} → {p.to}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium">{currency} {p.pricePerNight}/night</span>
                  <button onClick={() => onChange(rd.pricePeriods.filter((_, idx) => idx !== i))}
                    className="text-xs opacity-60 hover:opacity-100 hover:text-red-700 transition-opacity">
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500">From</label>
          <input type="date" value={from} min={today} onChange={e => setFrom(e.target.value)} className={`block w-full ${inp}`} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500">To</label>
          <input type="date" value={to} min={from || today} onChange={e => setTo(e.target.value)} className={`block w-full ${inp}`} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500">Price / night</label>
          <input type="number" min={0} placeholder="e.g. 550" value={price} onChange={e => setPrice(e.target.value)} className={`block w-full ${inp}`} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500">Label (optional)</label>
          <input placeholder="High Season" value={label} onChange={e => setLabel(e.target.value)} className={`block w-full ${inp}`} />
        </div>
      </div>
      <button onClick={add}
        className="mt-3 rounded-md bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors">
        Add Period
      </button>
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initial: AvailabilityData;
  rooms: RoomUnit[];
  currency?: string;
}

function defaultUnit(roomId: string, index: number): RoomUnitAvailability {
  return { id: `${roomId}-u${index + 1}`, blockedRanges: [] };
}

const defaultRoomAvail = (roomId: string): RoomAvailability => ({
  pricePerNight: 0,
  minStay: 1,
  pricePeriods: [],
  units: [defaultUnit(roomId, 0)],
});

export default function AvailabilityManager({ initial, rooms, currency = "USD" }: Props) {
  const [data, setData] = useState<AvailabilityData>(() => {
    const d: AvailabilityData = {};
    rooms.forEach((r) => {
      const saved = initial[r.id];
      if (saved) {
        d[r.id] = {
          ...saved,
          pricePeriods: saved.pricePeriods ?? [],
          // Migrate legacy format: if units is missing, wrap existing data
          units: saved.units && saved.units.length > 0
            ? saved.units
            : [defaultUnit(r.id, 0)],
        };
      } else {
        d[r.id] = defaultRoomAvail(r.id);
      }
    });
    return d;
  });

  const [activeRoom, setActiveRoom] = useState(rooms[0]?.id ?? "");
  const [activeUnitIdx, setActiveUnitIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [unsaved, setUnsaved] = useState(false);

  const rd = data[activeRoom] ?? defaultRoomAvail(activeRoom);
  // Clamp active unit index in case units were removed
  const safeUnitIdx = Math.min(activeUnitIdx, rd.units.length - 1);
  const activeUnit = rd.units[safeUnitIdx];

  const updateRoom = useCallback((patch: Partial<RoomAvailability>) => {
    setData((d) => ({ ...d, [activeRoom]: { ...(d[activeRoom] ?? defaultRoomAvail(activeRoom)), ...patch } }));
    setSaved(false);
    setUnsaved(true);
  }, [activeRoom]);

  /** Update just the active unit's blockedRanges, keeping all other units intact. */
  const updateActiveUnit = useCallback((newRanges: BlockedRange[]) => {
    setData((d) => {
      const room = d[activeRoom] ?? defaultRoomAvail(activeRoom);
      const updatedUnits = room.units.map((u, i) =>
        i === safeUnitIdx ? { ...u, blockedRanges: newRanges } : u
      );
      return { ...d, [activeRoom]: { ...room, units: updatedUnits } };
    });
    setSaved(false);
    setUnsaved(true);
  }, [activeRoom, safeUnitIdx]);

  function handleBlock(from: string, to: string) {
    const ranges = activeUnit.blockedRanges;
    const existing = ranges.filter((r) => !(to < r.from || from > r.to));
    const merged = existing.reduce(
      (acc, r) => ({ from: acc.from < r.from ? acc.from : r.from, to: acc.to > r.to ? acc.to : r.to }),
      { from, to }
    );
    const kept = ranges.filter((r) => to < r.from || from > r.to);
    const newRanges = [...kept, merged].sort((a, b) => a.from.localeCompare(b.from));
    // Auto-save immediately
    setData((d) => {
      const room = d[activeRoom] ?? defaultRoomAvail(activeRoom);
      const updatedUnits = room.units.map((u, i) => i === safeUnitIdx ? { ...u, blockedRanges: newRanges } : u);
      const newData = { ...d, [activeRoom]: { ...room, units: updatedUnits } };
      autoSave(newData);
      return newData;
    });
    setSaved(false);
  }

  function handleUnblock(from: string, to: string) {
    const result: BlockedRange[] = [];
    for (const r of activeUnit.blockedRanges) {
      if (to < r.from || from > r.to) { result.push(r); continue; }
      if (r.from < from) result.push({ from: r.from, to: prevDay(from) });
      if (r.to > to) result.push({ from: nextDay(to), to: r.to });
    }
    const newRanges = result.sort((a, b) => a.from.localeCompare(b.from));
    // Auto-save immediately
    setData((d) => {
      const room = d[activeRoom] ?? defaultRoomAvail(activeRoom);
      const updatedUnits = room.units.map((u, i) => i === safeUnitIdx ? { ...u, blockedRanges: newRanges } : u);
      const newData = { ...d, [activeRoom]: { ...room, units: updatedUnits } };
      autoSave(newData);
      return newData;
    });
    setSaved(false);
  }

  function handleRemove(origIdx: number) {
    const newRanges = activeUnit.blockedRanges.filter((_, idx) => idx !== origIdx);
    setData((d) => {
      const room = d[activeRoom] ?? defaultRoomAvail(activeRoom);
      const updatedUnits = room.units.map((u, i) => i === safeUnitIdx ? { ...u, blockedRanges: newRanges } : u);
      const newData = { ...d, [activeRoom]: { ...room, units: updatedUnits } };
      autoSave(newData);
      return newData;
    });
    setSaved(false);
  }

  function handleAddUnit() {
    const newIdx = rd.units.length;
    const newUnit = defaultUnit(activeRoom, newIdx);
    updateRoom({ units: [...rd.units, newUnit] });
    setActiveUnitIdx(newIdx);
  }

  function handleRemoveUnit(unitIdx: number) {
    if (rd.units.length <= 1) return; // always keep at least one unit
    const updated = rd.units.filter((_, i) => i !== unitIdx);
    updateRoom({ units: updated });
    setActiveUnitIdx(Math.max(0, unitIdx - 1));
  }

  function handleUnitLabelChange(label: string) {
    setData((d) => {
      const room = d[activeRoom] ?? defaultRoomAvail(activeRoom);
      const updatedUnits = room.units.map((u, i) =>
        i === safeUnitIdx ? { ...u, label: label || undefined } : u
      );
      return { ...d, [activeRoom]: { ...room, units: updatedUnits } };
    });
    setSaved(false);
    setUnsaved(true);
  }

  function prevDay(d: string) {
    const dt = new Date(d); dt.setDate(dt.getDate() - 1);
    return dt.toISOString().split("T")[0];
  }
  function nextDay(d: string) {
    const dt = new Date(d); dt.setDate(dt.getDate() + 1);
    return dt.toISOString().split("T")[0];
  }

  async function save(dataToSave = data) {
    setSaving(true);
    await fetch("/api/admin/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSave),
    });
    setSaving(false);
    setSaved(true);
    setUnsaved(false);
  }

  async function autoSave(newData: AvailabilityData) {
    setSaving(true);
    await fetch("/api/admin/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData),
    });
    setSaving(false);
    setSaved(true);
    setUnsaved(false);
  }

  if (rooms.length === 0) return <p className="text-sm text-gray-400">No rooms found. Add rooms first.</p>;

  return (
    <div className="space-y-6">
      {/* Room type tabs */}
      <div className="flex flex-wrap gap-2">
        {rooms.map((r) => (
          <button key={r.id} type="button"
            onClick={() => { setActiveRoom(r.id); setActiveUnitIdx(0); setSaved(false); }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeRoom === r.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {r.name}
            {data[r.id] && data[r.id].units.length > 1 && (
              <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
                {data[r.id].units.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Unit tabs + Add Unit */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mr-1">Units:</span>
          {rd.units.map((unit, i) => (
            <div key={unit.id} className="flex items-center gap-0.5">
              <button type="button"
                onClick={() => setActiveUnitIdx(i)}
                className={`rounded-l-md px-3 py-1.5 text-xs font-medium transition-colors ${safeUnitIdx === i ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {unit.label || `Unit ${i + 1}`}
              </button>
              {rd.units.length > 1 && (
                <button type="button"
                  onClick={() => handleRemoveUnit(i)}
                  title="Remove this unit"
                  className={`rounded-r-md px-1.5 py-1.5 text-xs transition-colors ${safeUnitIdx === i ? "bg-gray-600 text-white/70 hover:bg-rose-600 hover:text-white" : "bg-gray-100 text-gray-400 hover:bg-rose-100 hover:text-rose-600"}`}>
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddUnit}
            className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
            + Add Unit
          </button>
        </div>

        {/* Inline label editor for the active unit */}
        {activeUnit && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">Unit name:</span>
            <input
              type="text"
              value={activeUnit.label ?? ""}
              onChange={(e) => handleUnitLabelChange(e.target.value)}
              placeholder={`Unit ${safeUnitIdx + 1}`}
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 w-40"
            />
            <span className="text-[11px] text-gray-300">e.g. Room 101, Bungalow A</span>
          </div>
        )}
      </div>

      {/* Stats (per unit) */}
      {activeUnit && <StatsPanel unit={activeUnit} rd={rd} currency={currency} />}

      {/* Calendar (per unit) */}
      {activeUnit && (
        <Calendar
          unit={activeUnit}
          rd={rd}
          onBlock={handleBlock}
          onUnblock={handleUnblock}
        />
      )}

      {/* Blocked periods list (per unit) */}
      {activeUnit && (
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Blocked Periods — {activeUnit.label || `Unit ${safeUnitIdx + 1}`}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                <span className="inline-flex items-center gap-1 mr-3"><span className="h-2 w-2 rounded-full bg-rose-400 inline-block"/>Upcoming</span>
                <span className="inline-flex items-center gap-1 mr-3"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block"/>Active now</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-400 inline-block"/>Past</span>
              </p>
            </div>
            {saving && <span className="text-xs text-gray-400">Saving…</span>}
            {saved && !saving && <span className="text-xs text-emerald-600">✓ Saved</span>}
          </div>
          <BlockedList
            unit={activeUnit}
            rd={rd}
            currency={currency}
            onRemove={handleRemove}
          />
        </section>
      )}

      {/* Price periods (room-type level — applies to all units) */}
      <PricePeriodsPanel rd={rd} currency={currency}
        onChange={(periods) => updateRoom({ pricePeriods: periods })} />

      {/* Base settings (room-type level) */}
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Base Settings</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Base Price per Night ({currency})</label>
            <input type="number" min={0} value={rd.pricePerNight}
              onChange={(e) => updateRoom({ pricePerNight: Number(e.target.value) })}
              className={`block w-full ${inp}`} />
            <p className="mt-1 text-[11px] text-gray-400">Applies to all units. Used when no price period applies.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Minimum Stay (nights)</label>
            <input type="number" min={1} value={rd.minStay}
              onChange={(e) => updateRoom({ minStay: Number(e.target.value) })}
              className={`block w-full ${inp}`} />
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-600">Saved!</span>}
        <button type="button" onClick={() => save()} disabled={saving}
          className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : "Save Availability"}
        </button>
      </div>
    </div>
  );
}
