"use client";

import { useState, useCallback } from "react";
import type { Booking, BookingStatus } from "@/lib/types";
import PriceBreakdown from "@/components/template/PriceBreakdown";

// ─── Status display helpers ───────────────────────────────────────────────────

const STATUS_BADGE: Record<BookingStatus, { label: string; cls: string }> = {
  pending_review:       { label: "Review Needed",        cls: "bg-purple-100 text-purple-800" },
  pending_confirmation: { label: "Pending",              cls: "bg-amber-100 text-amber-800" },
  confirmed:            { label: "Confirmed",             cls: "bg-emerald-100 text-emerald-800" },
  pending_payment:      { label: "Awaiting Payment",      cls: "bg-amber-100 text-amber-800" },
  payment_failed:       { label: "Payment Failed",        cls: "bg-red-100 text-red-800" },
  payment_authorized:   { label: "Payment held",          cls: "bg-amber-100 text-amber-800" },
  rejected:             { label: "Rejected",              cls: "bg-red-100 text-red-700" },
  cancelled:            { label: "Cancelled",             cls: "bg-gray-100 text-gray-500" },
  expired:              { label: "Expired",               cls: "bg-gray-100 text-gray-500" },
  completed:            { label: "Completed",             cls: "bg-blue-100 text-blue-700" },
};

const PAYMENT_BADGE: Record<string, { label: string; cls: string }> = {
  none:       { label: "No charge",  cls: "bg-gray-100 text-gray-400" },
  pending:    { label: "Pending",    cls: "bg-amber-100 text-amber-700" },
  authorized: { label: "Authorized", cls: "bg-amber-100 text-amber-700" },
  paid:       { label: "Paid",       cls: "bg-emerald-100 text-emerald-700" },
  failed:     { label: "Failed",     cls: "bg-red-100 text-red-700" },
  refunded:   { label: "Refunded",   cls: "bg-purple-100 text-purple-700" },
};

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Returns a short relative label for a check-in date (from today's perspective).
 * "Today", "Tomorrow", "In 3 days", "3 days ago", or the formatted date for far-out dates.
 */
function relativeCheckIn(checkIn: string): { label: string; urgent: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cin = new Date(checkIn + "T00:00:00");
  const diff = Math.round((cin.getTime() - today.getTime()) / 86_400_000);

  if (diff === 0)  return { label: "Today",        urgent: true };
  if (diff === 1)  return { label: "Tomorrow",     urgent: true };
  if (diff === -1) return { label: "Yesterday",    urgent: false };
  if (diff > 1 && diff <= 7) return { label: `In ${diff} days`, urgent: false };
  if (diff < -1 && diff >= -7) return { label: `${-diff} days ago`, urgent: false };
  return { label: fmtDate(checkIn), urgent: false };
}

function isPastCheckOut(checkOut: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(checkOut + "T00:00:00") <= today;
}

// ─── Stripe dashboard links ───────────────────────────────────────────────────

function stripeSessionUrl(sessionId: string) {
  return `https://dashboard.stripe.com/checkout/sessions/${sessionId}`;
}
function stripePaymentUrl(intentId: string) {
  return `https://dashboard.stripe.com/payments/${intentId}`;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

type Filter = "all" | "confirmed" | "pending" | "cancelled";

const FILTER_LABELS: Record<Filter, string> = {
  all:       "All",
  confirmed: "Confirmed",
  pending:   "Pending",
  cancelled: "Cancelled / Rejected",
};

function matchesFilter(b: Booking, f: Filter) {
  if (f === "all")       return true;
  if (f === "confirmed") return b.status === "confirmed" || b.status === "completed";
  if (f === "pending")   return b.status === "pending_confirmation" || b.status === "pending_payment" || b.status === "payment_failed" || b.status === "payment_authorized";
  if (f === "cancelled") return b.status === "cancelled" || b.status === "expired" || b.status === "rejected";
  return true;
}

function matchesSearch(b: Booking, q: string) {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    b.guest.name.toLowerCase().includes(s) ||
    b.guest.email.toLowerCase().includes(s) ||
    b.confirmationCode.toLowerCase().includes(s) ||
    b.roomName.toLowerCase().includes(s)
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ bookings }: { bookings: Booking[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today.getTime() + 7 * 86_400_000);

  const active = bookings.filter((b) => b.status === "confirmed").length;

  const upcomingCheckins = bookings.filter((b) => {
    if (b.status !== "confirmed") return false;
    const cin = new Date(b.checkIn + "T00:00:00");
    return cin >= today && cin < nextWeek;
  }).length;

  const revenue = bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const needsAction = bookings.filter(
    (b) => b.status === "pending_review" || b.status === "pending_confirmation" || b.status === "payment_failed" || b.status === "payment_authorized"
  ).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <Stat label="Active bookings"     value={String(active)} />
      <Stat label="Check-ins this week" value={String(upcomingCheckins)} />
      <Stat label="Confirmed revenue"   value={`IDR ${(revenue / 1_000_000).toFixed(1)}M`} />
      <Stat
        label="Pending / on hold"
        value={String(needsAction)}
        highlight={needsAction > 0}
      />
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${highlight ? "text-amber-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  booking,
  onUpdate,
}: {
  booking: Booking;
  onUpdate: (b: Booking) => void;
}) {
  const [notes, setNotes] = useState(booking.adminNotes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmForce, setConfirmForce] = useState(false);
  const [forcing, setForcing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) onUpdate(data.booking);
    return res.ok;
  }

  // Auto-save notes on blur
  const saveNotesOnBlur = useCallback(async () => {
    if (notes === (booking.adminNotes ?? "")) return;
    const ok = await patch({ action: "notes", notes });
    if (ok) { setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, booking.adminNotes, booking.id]);

  async function doDecline() {
    setDeclining(true);
    const ok = await patch({ action: "decline", reason: declineReason || "Booking request declined" });
    if (ok) setConfirmDecline(false);
    setDeclining(false);
  }

  async function doAction(action: string) {
    setActionLoading(action);
    await patch({ action });
    setActionLoading(null);
  }

  async function doCancel() {
    setCancelling(true);
    const ok = await patch({ action: "cancel", reason: cancelReason || "Cancelled by admin" });
    if (ok) setConfirmCancel(false);
    setCancelling(false);
  }

  async function doForceConfirm() {
    setForcing(true);
    const ok = await patch({ action: "force_confirm" });
    if (ok) setConfirmForce(false);
    setForcing(false);
  }

  const canAccept       = booking.status === "pending_review";
  const canDecline      = booking.status === "pending_review";
  const canConfirm      = booking.status === "pending_confirmation";
  const canComplete     = booking.status === "confirmed" && isPastCheckOut(booking.checkOut);
  const canCancel       = ["pending_confirmation", "confirmed", "pending_payment", "payment_failed", "payment_authorized"].includes(booking.status);
  // Force confirm is the recovery path where the PI was captured but our write failed.
  const canForceConfirm = booking.status === "payment_authorized" && booking.confirmationMode === "payment";
  // Warn admin that a manual Stripe refund is needed if cancelling a paid booking
  const cancelNeedsRefund = booking.status === "confirmed" && booking.payment.status === "paid";

  const payBadge = PAYMENT_BADGE[booking.payment.status] ?? PAYMENT_BADGE.none;

  return (
    <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 space-y-5">

      {/* Guest */}
      <section>
        <SectionLabel>Guest</SectionLabel>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 text-sm">
          <Row label="Name">{booking.guest.name}</Row>
          <Row label="Email">
            <a href={`mailto:${booking.guest.email}`} className="text-primary hover:underline">
              {booking.guest.email}
            </a>
          </Row>
          {booking.guest.phone && <Row label="Phone">{booking.guest.phone}</Row>}
          <Row label="Guests">
            {booking.guest.adults} adult{booking.guest.adults !== 1 ? "s" : ""}
            {booking.guest.children > 0 ? `, ${booking.guest.children} child${booking.guest.children !== 1 ? "ren" : ""}` : ""}
          </Row>
        </div>
        {booking.guest.notes && (
          <div className="mt-2.5 text-xs text-gray-600 bg-white rounded-md border border-gray-200 px-3 py-2 leading-relaxed">
            <span className="text-gray-400 font-medium">Special requests: </span>{booking.guest.notes}
          </div>
        )}
      </section>

      {/* Price */}
      <section>
        <SectionLabel>Price breakdown</SectionLabel>
        <PriceBreakdown
          breakdown={booking.priceBreakdown}
          totalPrice={booking.totalPrice}
          currency={booking.currency}
          nights={booking.nights}
          compact
        />
      </section>

      {/* Payment */}
      {booking.payment.status !== "none" && (
        <section>
          <SectionLabel>Payment</SectionLabel>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${payBadge.cls}`}>{payBadge.label}</span>
              {booking.payment.method && <span className="text-xs text-gray-400 capitalize">{booking.payment.method}</span>}
            </div>
            {booking.payment.sessionId && (
              <p className="text-xs text-gray-500">
                Session:{" "}
                <a href={stripeSessionUrl(booking.payment.sessionId)} target="_blank" rel="noreferrer"
                   className="font-mono text-[11px] text-primary hover:underline">
                  {booking.payment.sessionId.slice(0, 24)}…
                </a>
                {" "}↗
              </p>
            )}
            {booking.payment.intentId && (
              <p className="text-xs text-gray-500">
                Payment:{" "}
                <a href={stripePaymentUrl(booking.payment.intentId)} target="_blank" rel="noreferrer"
                   className="font-mono text-[11px] text-primary hover:underline">
                  {booking.payment.intentId.slice(0, 24)}…
                </a>
                {" "}↗
              </p>
            )}
          </div>
        </section>
      )}

      {/* Authorization status — shown only for payment_authorized bookings */}
      {booking.status === "payment_authorized" && (() => {
        const authorizedMs = Date.now() - new Date(booking.updatedAt).getTime();
        const authorizedDays = authorizedMs / 86_400_000;
        const daysRemaining = Math.max(0, 7 - authorizedDays);
        const isNearExpiry = authorizedDays >= 5;
        const isLikelyExpired = authorizedDays >= 7;
        return (
          <section>
            <SectionLabel>Authorization status</SectionLabel>
            <div className={`rounded-lg border px-3 py-3 text-xs space-y-1.5 ${
              isLikelyExpired ? "border-red-200 bg-red-50" :
              isNearExpiry    ? "border-amber-200 bg-amber-50" :
                                "border-amber-100 bg-amber-50"
            }`}>
              <p className={`font-semibold ${isLikelyExpired ? "text-red-700" : "text-amber-700"}`}>
                {isLikelyExpired
                  ? "⚠ Authorization has likely expired (7+ days)"
                  : isNearExpiry
                    ? `⚠ Authorization expires in ~${Math.ceil(daysRemaining)} day${Math.ceil(daysRemaining) !== 1 ? "s" : ""}`
                    : "Payment held — awaiting iCal revalidation"
                }
              </p>
              <p className="text-gray-600 leading-relaxed">
                {isLikelyExpired
                  ? "The Stripe authorization hold has almost certainly expired. The next iCal sync will attempt capture and auto-reject if it fails — no charge will be made to the guest."
                  : "The guest's payment is authorized (held, not captured). The next iCal sync will either capture and confirm, or void and reject based on calendar availability."
                }
              </p>
              <p className="text-gray-500">
                Authorized ~{Math.floor(authorizedDays)} day{Math.floor(authorizedDays) !== 1 ? "s" : ""} ago.
                To reject manually: cancel this booking — the Stripe hold will be voided automatically.
              </p>
            </div>
          </section>
        );
      })()}

      {/* Timeline */}
      <section>
        <SectionLabel>Timeline</SectionLabel>
        <div className="space-y-1 text-xs text-gray-500">
          <TimelineRow label="Created"   ts={booking.createdAt} />
          {booking.confirmedAt  && <TimelineRow label="Confirmed"  ts={booking.confirmedAt} />}
          {booking.cancelledAt  && <TimelineRow label="Cancelled"  ts={booking.cancelledAt} note={booking.cancellationReason} />}
          <TimelineRow label="Check-in"  date={booking.checkIn} />
          <TimelineRow label="Check-out" date={booking.checkOut} />
          <Row label="Source">{booking.source} · {booking.confirmationMode}</Row>
          <Row label="Unit">{booking.unitId ?? "—"}</Row>
        </div>
      </section>

      {/* Admin notes */}
      <section>
        <SectionLabel>
          Admin notes
          {notesSaved && <span className="ml-2 text-emerald-600 font-normal normal-case">Saved</span>}
        </SectionLabel>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotesOnBlur}
          rows={2}
          placeholder="Internal notes (not visible to guest) — auto-saved on blur"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-gray-900 focus:outline-none resize-none bg-white"
        />
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {/* Request to Book: accept / decline */}
        {canAccept && (
          <ActionButton
            onClick={() => doAction("accept")}
            loading={actionLoading === "accept"}
            variant="primary"
          >
            Accept &amp; send payment link
          </ActionButton>
        )}
        {canDecline && !confirmDecline && (
          <ActionButton
            onClick={() => setConfirmDecline(true)}
            loading={false}
            variant="danger-outline"
          >
            Decline request
          </ActionButton>
        )}
        {confirmDecline && (
          <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
            <p className="text-xs font-medium text-red-700">
              Decline this booking request? The guest will be notified that their request was not accepted. No payment was ever taken.
            </p>
            <input
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              placeholder="Reason (optional — not shown to guest)"
              className="block w-full rounded border border-red-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={doDecline}
                disabled={declining}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {declining ? "Declining…" : "Yes, decline"}
              </button>
              <button
                onClick={() => setConfirmDecline(false)}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Nevermind
              </button>
            </div>
          </div>
        )}
        {canConfirm && (
          <ActionButton
            onClick={() => doAction("confirm")}
            loading={actionLoading === "confirm"}
            variant="primary"
          >
            Confirm booking
          </ActionButton>
        )}
        {canComplete && (
          <ActionButton
            onClick={() => doAction("complete")}
            loading={actionLoading === "complete"}
            variant="blue"
          >
            Mark as completed
          </ActionButton>
        )}
        <a
          href={`/booking/confirm/${booking.id}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          View confirmation page ↗
        </a>
        {canForceConfirm && !confirmForce && (
          <ActionButton
            onClick={() => setConfirmForce(true)}
            loading={false}
            variant="amber-outline"
          >
            Force confirm
          </ActionButton>
        )}
        {confirmForce && (
          <div className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-800">
              ⚠ Force confirm — use only in an emergency
            </p>
            <p className="text-xs text-amber-700 leading-relaxed">
              This marks the booking as confirmed and paid <strong>without capturing Stripe</strong>.
              Only use this if the Stripe dashboard confirms the payment was already captured
              but our system failed to write the confirmation. Sending a confirmation email to
              the guest is included.
            </p>
            <div className="flex gap-2">
              <button
                onClick={doForceConfirm}
                disabled={forcing}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {forcing ? "Confirming…" : "Yes, force confirm"}
              </button>
              <button
                onClick={() => setConfirmForce(false)}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Nevermind
              </button>
            </div>
          </div>
        )}
        {canCancel && !confirmCancel && (
          <ActionButton
            onClick={() => setConfirmCancel(true)}
            loading={false}
            variant="danger-outline"
          >
            Cancel booking
          </ActionButton>
        )}
        {confirmCancel && (
          <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
            <p className="text-xs font-medium text-red-700">
              Confirm cancellation — this will free the dates immediately.
            </p>
            {cancelNeedsRefund && (
              <div className="rounded-md border border-red-300 bg-white px-2.5 py-2">
                <p className="text-xs font-semibold text-red-700">
                  ⚠ This booking has a captured payment
                </p>
                <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                  Stripe does not issue automatic refunds on cancellation.
                  After cancelling here, you must manually issue a refund from
                  the{" "}
                  {booking.payment.intentId ? (
                    <a
                      href={stripePaymentUrl(booking.payment.intentId)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium"
                    >
                      Stripe dashboard ↗
                    </a>
                  ) : (
                    "Stripe dashboard"
                  )}
                  .
                </p>
              </div>
            )}
            <input
              placeholder="Reason (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="block w-full rounded-md border border-red-200 px-2 py-1.5 text-xs focus:outline-none bg-white"
            />
            <div className="flex gap-2">
              <button
                onClick={doCancel}
                disabled={cancelling}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Yes, cancel"}
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Nevermind
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small UI primitives ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
      {children}
    </p>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="font-medium text-gray-700 text-right">{children}</span>
    </div>
  );
}

function TimelineRow({ label, ts, date, note }: { label: string; ts?: string; date?: string; note?: string }) {
  const display = ts ? fmtDateTime(ts) : date ? fmtDate(date) : "—";
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-right">
        {display}
        {note && <span className="ml-1 text-gray-400 italic">({note})</span>}
      </span>
    </div>
  );
}

function ActionButton({
  onClick,
  loading,
  variant,
  children,
}: {
  onClick: () => void;
  loading: boolean;
  variant: "primary" | "blue" | "amber-outline" | "danger-outline";
  children: React.ReactNode;
}) {
  const cls = {
    primary:          "bg-emerald-600 text-white hover:bg-emerald-700",
    blue:             "bg-blue-600 text-white hover:bg-blue-700",
    "amber-outline":  "border border-amber-300 text-amber-700 hover:bg-amber-50",
    "danger-outline": "border border-red-200 text-red-600 hover:bg-red-50",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${cls}`}
    >
      {loading ? "…" : children}
    </button>
  );
}

// ─── Booking row ──────────────────────────────────────────────────────────────

function BookingRow({
  booking,
  expanded,
  onToggle,
  onUpdate,
}: {
  booking: Booking;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (b: Booking) => void;
}) {
  const badge = STATUS_BADGE[booking.status];
  const isMuted = booking.status === "cancelled" || booking.status === "expired" || booking.status === "rejected";
  const needsAction =
    booking.status === "pending_confirmation" ||
    booking.status === "payment_failed" ||
    booking.status === "payment_authorized";
  const authDays = booking.status === "payment_authorized"
    ? (Date.now() - new Date(booking.updatedAt).getTime()) / 86_400_000
    : 0;
  const authExpiring = authDays >= 5;
  const rel = relativeCheckIn(booking.checkIn);

  return (
    <div
      className={`rounded-lg border bg-white overflow-hidden transition-opacity ${isMuted ? "opacity-55" : ""} ${authExpiring ? "border-red-300" : needsAction ? "border-amber-300" : "border-gray-200"}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        {/* Code + date */}
        <div className="shrink-0 w-28">
          <p className="font-mono text-sm font-bold text-gray-900 tracking-wider">
            {booking.confirmationCode}
          </p>
          <p className={`text-[10px] mt-0.5 font-medium ${rel.urgent ? "text-amber-600" : "text-gray-400"}`}>
            {rel.label}
          </p>
        </div>

        {/* Guest + room */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{booking.guest.name}</p>
          <p className="text-xs text-gray-400 truncate">{booking.roomName}</p>
        </div>

        {/* Check-in → check-out */}
        <div className="hidden md:block shrink-0 text-xs text-gray-400">
          <p className="text-gray-600">{fmtDate(booking.checkIn)}</p>
          <p>→ {fmtDate(booking.checkOut)}</p>
        </div>

        {/* Total */}
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-gray-900">
            {fmtMoney(booking.totalPrice, booking.currency)}
          </p>
          <p className="text-[10px] text-gray-400">{booking.nights}n</p>
        </div>

        {/* Status */}
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
          {badge.label}
        </span>

        {/* Chevron */}
        <svg
          className={`shrink-0 h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <DetailPanel booking={booking} onUpdate={onUpdate} />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingsList({
  initialBookings,
}: {
  initialBookings: Booking[];
  currency: string; // kept for compat but currency is per-booking
}) {
  const [bookings, setBookings] = useState<Booking[]>(
    // Most recent first
    [...initialBookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  );
  const [filter, setFilter]   = useState<Filter>("all");
  const [search, setSearch]   = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function updateBooking(updated: Booking) {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  const counts: Record<Filter, number> = {
    all:       bookings.length,
    confirmed: bookings.filter((b) => matchesFilter(b, "confirmed")).length,
    pending:   bookings.filter((b) => matchesFilter(b, "pending")).length,
    cancelled: bookings.filter((b) => matchesFilter(b, "cancelled")).length,
  };

  const filtered = bookings
    .filter((b) => matchesFilter(b, filter))
    .filter((b) => matchesSearch(b, search));

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <StatsBar bookings={bookings} />

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-0 flex-1">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                filter === f
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {FILTER_LABELS[f]}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative shrink-0 sm:w-56">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M16.5 10.5a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, code…"
            className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-xs focus:border-gray-900 focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-400">
            {search ? `No bookings match "${search}".` : "No bookings in this category yet."}
          </p>
          {!search && filter === "all" && (
            <p className="text-xs text-gray-400 mt-1">
              Bookings made through the availability widget will appear here.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              expanded={expandedId === b.id}
              onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
              onUpdate={updateBooking}
            />
          ))}
        </div>
      )}
    </div>
  );
}
