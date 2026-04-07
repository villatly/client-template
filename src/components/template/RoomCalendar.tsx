"use client";

import { useEffect, useState, useCallback } from "react";
import type { RoomAvailability, RoomUnitAvailability, BlockedRange, PricePeriod, RoomUnit, BookingPrefill } from "@/lib/types";
import { calculatePrice, isRangeBlocked } from "@/lib/pricing";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const PERIOD_COLORS = [
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-emerald-100 text-emerald-800",
  "bg-pink-100 text-pink-800",
];
const PERIOD_DOTS = ["bg-amber-400","bg-sky-400","bg-violet-400","bg-emerald-400","bg-pink-400"];

function toStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function addDay(ds: string): string {
  const d = new Date(ds + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split("T")[0];
}
function calendarCells(y: number, m: number): (number | null)[] {
  const first = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** A date is displayed as blocked only when ALL units are blocked on that night. */
function isDateBlockedInAllUnits(date: string, units: RoomUnitAvailability[]): boolean {
  return units.every((u) => u.blockedRanges.some((r) => date >= r.from && date <= r.to));
}

/**
 * A range is "range-blocked" when NO single unit has the full range free.
 * (i.e. there's no unit you could book for the whole stay)
 */
function isRangeBlockedAcrossAllUnits(
  checkIn: string,
  checkOut: string,
  units: RoomUnitAvailability[]
): boolean {
  return !units.some((u) => !isRangeBlocked(checkIn, checkOut, u.blockedRanges));
}

function getPeriodIdx(date: string, periods: PricePeriod[]) {
  return periods.findIndex((p) => date >= p.from && date <= p.to);
}
function effectivePrice(date: string, data: RoomAvailability) {
  const i = getPeriodIdx(date, data.pricePeriods);
  return i >= 0 ? data.pricePeriods[i].pricePerNight : data.pricePerNight;
}
function inSelRange(ds: string, a: string | null, b: string | null) {
  if (!a || !b) return false;
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return ds >= lo && ds <= hi;
}

// ─── Interactive month grid ───────────────────────────────────────────────────

function MonthGrid({
  year, month, data, today,
  selStart, selEnd, hover,
  onDayClick, onDayHover,
  interactive,
}: {
  year: number; month: number;
  data: RoomAvailability; today: string;
  selStart: string | null; selEnd: string | null; hover: string | null;
  onDayClick: (ds: string) => void;
  onDayHover: (ds: string | null) => void;
  interactive: boolean;
}) {
  const cells = calendarCells(year, month);
  const effectiveEnd = selEnd ?? (selStart ? hover : null);

  return (
    <div>
      <p className="mb-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {MONTHS[month]} {year}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {DOW_SHORT.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = toStr(year, month, d);
          const past = ds < today;
          // "blocked" for display = ALL units are blocked on this night
          const blocked = isDateBlockedInAllUnits(ds, data.units);
          const pIdx = past ? -1 : getPeriodIdx(ds, data.pricePeriods);
          const price = past || blocked ? null : effectivePrice(ds, data);

          const isStart = ds === selStart;
          const isEnd = ds === (selEnd ?? (selStart ? hover : null));
          const inRange = inSelRange(ds, selStart, effectiveEnd);
          const isEndpoint = isStart || isEnd;

          let cls = "flex aspect-square flex-col items-center justify-center rounded text-[11px] leading-none select-none";

          if (interactive && !past && !blocked) {
            cls += " cursor-pointer";
          }

          if (isEndpoint) {
            cls += " bg-gray-900 text-white font-semibold";
          } else if (inRange) {
            cls += " bg-gray-200 text-gray-800";
          } else if (past) {
            cls += " text-gray-300";
          } else if (blocked) {
            cls += " bg-rose-100 text-rose-600 cursor-default";
          } else if (pIdx >= 0) {
            cls += ` ${PERIOD_COLORS[pIdx % PERIOD_COLORS.length]}`;
            if (interactive) cls += " hover:opacity-80";
          } else {
            cls += " text-gray-700";
            if (interactive) cls += " hover:bg-gray-100";
          }

          return (
            <div
              key={i}
              className={cls}
              title={blocked ? "Not available" : price ? `$${price}/night` : undefined}
              onClick={() => interactive && !past && !blocked && onDayClick(ds)}
              onMouseEnter={() => interactive && onDayHover(ds)}
              onMouseLeave={() => interactive && onDayHover(null)}
            >
              <span>{d}</span>
              {!isEndpoint && !inRange && price != null && (
                <span className="text-[8px] opacity-60 mt-0.5 leading-none">{price}</span>
              )}
              {blocked && ds >= today && !isEndpoint && (
                <span className="text-[8px] mt-0.5 opacity-70">✕</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  roomId: string;
  room: RoomUnit;
  /** Called when the guest selects dates and clicks "Book". Null = read-only mode. */
  onBook?: (prefill: BookingPrefill) => void;
}

export default function RoomCalendar({ roomId, room, onBook }: Props) {
  const [data, setData] = useState<RoomAvailability | null>(null);
  const [error, setError] = useState(false);

  const [selStart, setSelStart] = useState<string | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const interactive = !!onBook;

  useEffect(() => {
    fetch(`/api/rooms/${roomId}/calendar`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, [roomId]);

  const handleDayClick = useCallback((ds: string) => {
    if (!selStart) {
      setSelStart(ds);
      setSelEnd(null);
    } else if (!selEnd) {
      if (ds === selStart) { setSelStart(null); return; }
      setSelEnd(ds);
      setHover(null);
    } else {
      setSelStart(ds);
      setSelEnd(null);
    }
  }, [selStart, selEnd]);

  const [checkIn, checkOut] = selStart && selEnd
    ? (selStart <= selEnd ? [selStart, addDay(selEnd)] : [selEnd, addDay(selStart)])
    : [null, null];

  const priceCalc = data && checkIn && checkOut
    ? calculatePrice(data, checkIn, checkOut)
    : null;

  // Range is blocked when NO unit can accommodate the full stay
  const rangeHasBlockedNight = data && checkIn && checkOut
    ? isRangeBlockedAcrossAllUnits(checkIn, checkOut, data.units)
    : false;

  const meetsMinStay = data && priceCalc
    ? priceCalc.totalNights >= data.minStay
    : false;

  const selectionValid = !!priceCalc && !rangeHasBlockedNight && meetsMinStay;

  function handleBook() {
    if (!data || !priceCalc || !checkIn || !checkOut || !onBook || !selectionValid) return;
    onBook({
      room,
      checkIn,
      checkOut,
      nights:           priceCalc.totalNights,
      priceBreakdown:   priceCalc.breakdown,
      totalPrice:       priceCalc.totalPrice,
      avgPricePerNight: priceCalc.avgPricePerNight,
      minStay:          data.minStay,
    });
  }

  if (error) return (
    <div className="py-8 text-center text-sm text-gray-400">
      Availability information is not available for this room.
    </div>
  );
  if (!data) return (
    <div className="py-10 text-center">
      <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
    </div>
  );

  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const daysInCurMonth = new Date(curYear, curMonth + 1, 0).getDate();
  // Count nights where at least one unit is free
  let availCount = 0;
  for (let d = now.getDate(); d <= daysInCurMonth; d++) {
    const ds = toStr(curYear, curMonth, d);
    if (!isDateBlockedInAllUnits(ds, data.units)) availCount++;
  }
  const activePeriods = data.pricePeriods.filter((p) => p.to >= today);
  const totalUnits = data.units.length;

  return (
    <div>
      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 mb-5 text-sm">
        <div>
          <span className="text-gray-500 text-xs">Base rate</span>
          <p className="font-semibold text-gray-900">${data.pricePerNight}<span className="text-xs font-normal text-gray-400">/night</span></p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Min. stay</span>
          <p className="font-semibold text-gray-900">{data.minStay} {data.minStay === 1 ? "night" : "nights"}</p>
        </div>
        {totalUnits > 1 && (
          <div>
            <span className="text-gray-500 text-xs">Units</span>
            <p className="font-semibold text-gray-900">{totalUnits} rooms</p>
          </div>
        )}
        <div>
          <span className="text-gray-500 text-xs">Available this month</span>
          <p className="font-semibold text-emerald-600">{availCount} nights</p>
        </div>
      </div>

      {/* Price period legend */}
      {activePeriods.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activePeriods.map((p, i) => (
            <span key={i} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${PERIOD_COLORS[i % PERIOD_COLORS.length]}`}>
              <span className={`h-2 w-2 rounded-full ${PERIOD_DOTS[i % PERIOD_DOTS.length]}`} />
              {p.label || "Special Period"}: ${p.pricePerNight}/night
            </span>
          ))}
        </div>
      )}

      {/* Instruction hint */}
      {interactive && (
        <p className="mb-3 text-center text-xs text-gray-400">
          {!selStart
            ? "Click a date to select your check-in"
            : !selEnd
            ? "Now click your check-out date"
            : selectionValid
            ? "Dates selected — review and book below"
            : rangeHasBlockedNight
            ? "Your selection includes unavailable dates — please adjust"
            : `Minimum stay is ${data.minStay} nights`}
        </p>
      )}

      {/* Calendar grids */}
      <div className="grid gap-6 sm:grid-cols-3">
        {months.map(({ year, month }) => (
          <MonthGrid
            key={`${year}-${month}`}
            year={year} month={month}
            data={data} today={today}
            selStart={selStart} selEnd={selEnd} hover={hover}
            onDayClick={handleDayClick}
            onDayHover={setHover}
            interactive={interactive}
          />
        ))}
      </div>

      {/* Booking action bar */}
      {interactive && selStart && selEnd && (
        <div className={`mt-4 rounded-lg border px-4 py-3 flex items-center justify-between gap-4 ${selectionValid ? "bg-gray-900 border-gray-900" : "bg-gray-100 border-gray-200"}`}>
          <div className="text-sm">
            {selectionValid && priceCalc ? (
              <>
                <span className="font-semibold text-white">
                  {checkIn} → {checkOut}
                </span>
                <span className="text-white/60 ml-2 text-xs">
                  {priceCalc.totalNights} nights · ${priceCalc.totalPrice.toLocaleString()} total
                </span>
              </>
            ) : (
              <span className="text-gray-500 text-xs">
                {rangeHasBlockedNight
                  ? "Selection includes unavailable dates"
                  : `Min. stay: ${data.minStay} nights`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectionValid && (
              <button
                type="button"
                onClick={handleBook}
                className="rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
              >
                Book these dates →
              </button>
            )}
            <button
              type="button"
              onClick={() => { setSelStart(null); setSelEnd(null); }}
              className={`text-xs transition-colors ${selectionValid ? "text-white/50 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-gray-500 border-t border-gray-100 pt-3">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-100 border border-rose-200" /> Unavailable</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-white border border-gray-200" /> Available</span>
        {activePeriods.map((p, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded ${PERIOD_DOTS[i % PERIOD_DOTS.length]}`} />
            {p.label || `Period ${i + 1}`}
          </span>
        ))}
        {interactive && <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-gray-900" /> Selected</span>}
      </div>
    </div>
  );
}
