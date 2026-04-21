/**
 * Bookings domain layer — all booking business logic lives here.
 *
 * Responsibilities:
 *   - Persist and retrieve booking records (bookings.json)
 *   - Enforce status transition rules
 *   - Coordinate availability blocking/unblocking when status changes
 *
 * Intentionally NOT responsible for:
 *   - HTTP parsing / response formatting (that belongs in route handlers)
 *   - Price calculation (see lib/pricing.ts)
 *   - Property content (see lib/property.ts)
 *
 * V2 extension points (no code needed now):
 *   - Replace file I/O with a DB adapter behind the same interface
 *   - Add payment confirmation in confirmBooking (called by webhook handler)
 *   - Add email notification dispatch after status changes
 *   - Add expiry cron job using the status transition rules
 */

import { randomUUID } from "crypto";
import type {
  Booking,
  BookingGuest,
  BookingPayment,
  BookingStatus,
  BlockedRange,
  PriceLineItem,
  AvailabilityData,
  RoomUnitAvailability,
} from "./types";
import { readFile, writeFile } from "./storage";
import { getAvailability, writeAvailability } from "./property";
import { isRangeBlocked } from "./pricing";

// ─── Persistence ──────────────────────────────────────────────────────────────

const BOOKINGS_KEY = "bookings.json";

export async function getBookings(): Promise<Booking[]> {
  try {
    return JSON.parse(await readFile(BOOKINGS_KEY)) as Booking[];
  } catch {
    return [];
  }
}

async function writeBookings(bookings: Booking[]): Promise<void> {
  await writeFile(BOOKINGS_KEY, JSON.stringify(bookings, null, 2));
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
  return (await getBookings()).find((b) => b.id === id);
}

// ─── Status transition rules ──────────────────────────────────────────────────

/**
 * Defines all legal status transitions.
 * This is the authoritative list — enforced server-side on every status update.
 * Extend this map when V2 adds new statuses; all other code stays the same.
 */
const TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  pending_review:       ["pending_payment", "cancelled"],
  pending_confirmation: ["confirmed", "cancelled"],
  confirmed:            ["cancelled", "completed"],
  pending_payment:      ["confirmed", "payment_authorized", "payment_failed", "cancelled", "expired", "rejected"],
  payment_failed:       ["pending_payment", "cancelled", "expired"],
  payment_authorized:   ["confirmed", "rejected", "cancelled"],
  // Terminal states — no outbound transitions:
  rejected:   [],
  cancelled:  [],
  expired:    [],
  completed:  [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split("T")[0];
}

function generateConfirmationCode(): string {
  // Format: YYMM-XXXXXX  (no ambiguous chars I/1/O/0)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  const now = new Date();
  const ym =
    now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0");
  return `${ym}-${suffix}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Availability coordination ────────────────────────────────────────────────

/**
 * Add a blocked range to availability.json for the booking's specific unit.
 * The range covers [checkIn, checkOut-1] so that checkOut day stays open
 * for same-day-arrival guests.
 *
 * Uses bookingId on the range so we can find and remove it on cancellation
 * without depending on exact date matching.
 */
async function blockDates(booking: Booking): Promise<void> {
  const avail: AvailabilityData = await getAvailability();
  const roomData = avail[booking.roomId];
  if (!roomData || roomData.units.length === 0) return;

  // Find the target unit — fall back to unit 0 for legacy bookings without unitId
  const targetUnitIdx = booking.unitId
    ? roomData.units.findIndex((u) => u.id === booking.unitId)
    : 0;
  const unitIdx = targetUnitIdx >= 0 ? targetUnitIdx : 0;

  const lastNight = prevDay(booking.checkOut);
  const newRange: BlockedRange = {
    from: booking.checkIn,
    to: lastNight,
    bookingId: booking.id,
  };

  const updatedUnits = roomData.units.map((u, i) => {
    if (i !== unitIdx) return u;
    // Remove any pre-existing range for this booking (idempotent)
    const kept = u.blockedRanges.filter((r) => r.bookingId !== booking.id);
    return {
      ...u,
      blockedRanges: [...kept, newRange].sort((a, b) => a.from.localeCompare(b.from)),
    };
  });

  avail[booking.roomId] = { ...roomData, units: updatedUnits };
  await writeAvailability(avail);
}

/**
 * Remove the blocked range created by this booking from availability.json.
 * Called when a booking is cancelled so the dates open back up immediately.
 */
async function unblockDates(booking: Booking): Promise<void> {
  const avail: AvailabilityData = await getAvailability();
  const roomData = avail[booking.roomId];
  if (!roomData) return;

  const updatedUnits = roomData.units.map((u) => ({
    ...u,
    blockedRanges: u.blockedRanges.filter((r) => r.bookingId !== booking.id),
  }));

  avail[booking.roomId] = { ...roomData, units: updatedUnits };
  await writeAvailability(avail);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface CreateBookingInput {
  roomId: string;
  /** The specific physical unit to book (e.g. "room-1-u2"). Should be set by the route handler. */
  unitId?: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  currency: string;
  priceBreakdown: PriceLineItem[];
  totalPrice: number;
  guest: BookingGuest;
  /** Defaults to "direct" — set to "admin" for manually created bookings. */
  source?: Booking["source"];
  /**
   * Controls the initial status and confirmation path:
   *   "auto"     — pending_confirmation (legacy: frontend calls confirm immediately)
   *   "manual"   — pending_confirmation (legacy: admin confirms from dashboard)
   *   "payment"  — pending_payment (instant_book: Stripe webhook → capture → confirm in one shot)
   *   "request"  — pending_review (request_to_book: admin accepts → payment link → guest pays → confirm)
   */
  confirmationMode?: "auto" | "manual" | "payment" | "request";
}

/**
 * Create a new booking.
 *
 * auto:     status = "pending_confirmation" (legacy).
 * manual:   status = "pending_confirmation" (legacy).
 * payment:  status = "pending_payment" — instant_book: webhook: authorize → capture → confirm (one shot).
 * request:  status = "pending_review"  — request_to_book: admin accepts → payment link → guest pays.
 *
 * NOTE: This function does NOT re-validate availability. The route handler
 * must check availability immediately before calling this, and accept that
 * a tiny race window exists. V2 with a real DB should use transactions.
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const timestamp = now();
  const confirmationMode = input.confirmationMode ?? "auto";

  const initialStatus: BookingStatus =
    confirmationMode === "payment"  ? "pending_payment"  :
    confirmationMode === "request"  ? "pending_review"   :
    "pending_confirmation";

  const booking: Booking = {
    id: randomUUID(),
    confirmationCode: generateConfirmationCode(),
    createdAt: timestamp,
    updatedAt: timestamp,

    roomId: input.roomId,
    unitId: input.unitId,
    roomName: input.roomName,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights: input.nights,

    currency: input.currency,
    priceBreakdown: input.priceBreakdown,
    totalPrice: input.totalPrice,

    guest: input.guest,

    status: initialStatus,
    source: input.source ?? "direct",
    confirmationMode,

    payment: {
      status: confirmationMode === "payment" ? "pending" : "none",
    },
    notifications: {},
  };

  // NOTE: Booking is intentionally NOT confirmed here.
  // Confirmation is always a separate step (POST /api/bookings/[id]/confirm).
  // This separation is what makes the flow compatible with:
  //   V1: frontend calls confirm immediately after create (auto flow)
  //   V2: payment provider calls confirm via webhook after successful payment
  //   V2: admin manually confirms from the dashboard
  const bookings = await getBookings();
  await writeBookings([...bookings, booking]);
  return booking;
}

/**
 * Confirm a booking and block its dates.
 *
 * Performs a final server-side availability recheck before blocking to guard
 * against the race window between creation and confirmation (two guests
 * creating bookings for the same dates simultaneously).
 *
 * Throws "DATES_UNAVAILABLE" if the dates were taken by another booking.
 * The caller (route handler or payment webhook) must handle this gracefully.
 *
 * @param id            Booking UUID
 * @param paymentDetails  Optional payment snapshot from provider (Stripe, etc.)
 *                        When provided, replaces the booking's payment sub-record.
 *
 * auto:   called immediately by the frontend (no payment details).
 * manual: called by admin PATCH route (no payment details) for pending_confirmation bookings.
 *
 * NOTE: Stripe-payment paths (internal and external mode) no longer go through this function.
 * They use authorizeBooking() → confirmAuthorizedBooking() so that no money is ever
 * captured before availability is confirmed.
 */
export async function confirmBooking(
  id: string,
  paymentDetails?: Partial<BookingPayment>
): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  const booking = bookings[idx];
  if (!canTransition(booking.status, "confirmed")) {
    throw new Error(`Cannot confirm booking in status "${booking.status}"`);
  }

  // ── Final availability recheck ────────────────────────────────────────
  // Check only the specific unit that was assigned to this booking.
  // Excludes any block created by THIS booking (idempotent re-confirm).
  const avail = await getAvailability();
  const roomData = avail[booking.roomId];
  if (roomData && roomData.units.length > 0) {
    const unitIdx = booking.unitId
      ? roomData.units.findIndex((u) => u.id === booking.unitId)
      : 0;
    const unit = roomData.units[unitIdx >= 0 ? unitIdx : 0];
    const otherBlocks = unit.blockedRanges.filter((r) => r.bookingId !== id);
    if (isRangeBlocked(booking.checkIn, booking.checkOut, otherBlocks)) {
      throw new Error("DATES_UNAVAILABLE");
    }
  }

  const timestamp = now();
  bookings[idx] = {
    ...booking,
    status: "confirmed",
    confirmedAt: timestamp,
    updatedAt: timestamp,
    // Merge payment details if provided (Stripe webhook sets status "paid" + intentId)
    payment: paymentDetails
      ? { ...booking.payment, ...paymentDetails }
      : booking.payment,
  };
  await writeBookings(bookings);
  await blockDates(bookings[idx]);
  return bookings[idx];
}

/**
 * Expire a booking that was never paid (Checkout Session timed out).
 * Frees no dates (they were never blocked for pending_payment bookings).
 */
export async function expireBooking(id: string): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  const booking = bookings[idx];
  if (!canTransition(booking.status, "expired")) {
    throw new Error(`Cannot expire booking in status "${booking.status}"`);
  }

  const timestamp = now();
  bookings[idx] = {
    ...booking,
    status: "expired",
    updatedAt: timestamp,
    payment: { ...booking.payment, status: "failed" },
  };
  await writeBookings(bookings);
  // No need to unblockDates — pending_payment bookings never block dates
  return bookings[idx];
}

/**
 * Record a failed payment attempt without changing booking status.
 * Allows the guest to retry (status stays "pending_payment" or moves to "payment_failed").
 */
export async function recordPaymentFailure(id: string, intentId?: string): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  const booking = bookings[idx];
  if (!canTransition(booking.status, "payment_failed")) {
    throw new Error(
      `Cannot record payment failure for booking in status "${booking.status}"`
    );
  }

  const timestamp = now();
  bookings[idx] = {
    ...booking,
    status: "payment_failed",
    updatedAt: timestamp,
    payment: {
      ...booking.payment,
      status: "failed",
      intentId: intentId ?? booking.payment.intentId,
    },
  };
  await writeBookings(bookings);
  return bookings[idx];
}

/**
 * Attach a Stripe Checkout Session ID to the booking immediately after session creation.
 * Stores the session ID (cs_...) so the admin can find it in the Stripe dashboard.
 * The PaymentIntent ID (pi_...) is stored separately when the webhook fires.
 */
export async function attachStripeSession(id: string, sessionId: string): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  bookings[idx] = {
    ...bookings[idx],
    updatedAt: now(),
    payment: { ...bookings[idx].payment, sessionId, method: "stripe" },
  };
  await writeBookings(bookings);
  return bookings[idx];
}

/**
 * Authorize a booking (external mode).
 *
 * Called by the Stripe webhook after `checkout.session.completed` when
 * confirmationMode === "payment". The Stripe session was created with
 * `capture_method: "manual"`, so money is only held (not captured yet).
 *
 * Transitions: pending_payment → payment_authorized
 * Side effects: blocks the dates tentatively (so same-unit double-auth is prevented).
 *
 * Confirmation happens later in the iCal sync route after revalidation.
 * If a conflict is found, use rejectBooking() to void the hold and unblock.
 */
export async function authorizeBooking(
  id: string,
  paymentDetails?: Partial<BookingPayment>
): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  const booking = bookings[idx];
  if (!canTransition(booking.status, "payment_authorized")) {
    throw new Error(`Cannot authorize booking in status "${booking.status}"`);
  }

  // Availability recheck — same logic as confirmBooking, ensures no same-unit double-auth.
  const avail = await getAvailability();
  const roomData = avail[booking.roomId];
  if (roomData && roomData.units.length > 0) {
    const unitIdx = booking.unitId
      ? roomData.units.findIndex((u) => u.id === booking.unitId)
      : 0;
    const unit = roomData.units[unitIdx >= 0 ? unitIdx : 0];
    const otherBlocks = unit.blockedRanges.filter((r) => r.bookingId !== id);
    if (isRangeBlocked(booking.checkIn, booking.checkOut, otherBlocks)) {
      throw new Error("DATES_UNAVAILABLE");
    }
  }

  const timestamp = now();
  bookings[idx] = {
    ...booking,
    status: "payment_authorized",
    updatedAt: timestamp,
    payment: paymentDetails
      ? { ...booking.payment, ...paymentDetails }
      : booking.payment,
  };
  await writeBookings(bookings);
  // Block dates tentatively — these will stay blocked until confirm or reject.
  await blockDates(bookings[idx]);
  return bookings[idx];
}

/**
 * Confirm an authorized booking after successful iCal revalidation.
 *
 * Called by the iCal sync route after finding no conflict for a payment_authorized booking.
 * The Stripe PaymentIntent has already been captured by the caller before this is invoked.
 *
 * Transitions: payment_authorized → confirmed
 * NOTE: Does NOT re-block dates (already blocked by authorizeBooking).
 * NOTE: Does NOT re-check availability (caller already validated no iCal conflict).
 */
export async function confirmAuthorizedBooking(
  id: string,
  paymentDetails?: Partial<BookingPayment>
): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  const booking = bookings[idx];
  if (!canTransition(booking.status, "confirmed")) {
    throw new Error(`Cannot confirm authorized booking in status "${booking.status}"`);
  }

  const timestamp = now();
  bookings[idx] = {
    ...booking,
    status: "confirmed",
    confirmedAt: timestamp,
    updatedAt: timestamp,
    payment: paymentDetails
      ? { ...booking.payment, ...paymentDetails }
      : booking.payment,
  };
  await writeBookings(bookings);
  // Dates already blocked — no need to call blockDates again.
  return bookings[idx];
}

/**
 * Reject an authorized booking after a conflict is detected during iCal revalidation.
 *
 * Called by the iCal sync route when a newly-synced iCal block overlaps the booking.
 * The Stripe PaymentIntent must be cancelled by the caller BEFORE calling this, so
 * the authorization hold is released before we mark the booking as rejected.
 *
 * Transitions: payment_authorized → rejected
 * Side effects: unblocks the dates immediately.
 */
export async function rejectBooking(id: string, reason?: string): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  const booking = bookings[idx];
  if (!canTransition(booking.status, "rejected")) {
    throw new Error(`Cannot reject booking in status "${booking.status}"`);
  }

  const timestamp = now();
  bookings[idx] = {
    ...booking,
    status: "rejected",
    cancelledAt: timestamp,
    cancellationReason: reason ?? "Booking unavailable — dates taken on another platform",
    updatedAt: timestamp,
    // "refunded" if payment was authorized (hold voided); "failed" if it was never authorized
    // (e.g. DATES_UNAVAILABLE hit while still in pending_payment — no money was ever held).
    payment: {
      ...booking.payment,
      status: booking.payment.status === "authorized" ? "refunded" : "failed",
    },
  };
  await writeBookings(bookings);
  await unblockDates(booking);
  return bookings[idx];
}

/**
 * Cancel a booking and immediately free its dates.
 *
 * ── PI void responsibility ───────────────────────────────────────────────────
 * This function does NOT interact with Stripe. If the booking has a Stripe
 * PaymentIntent (payment.intentId), the caller must handle it BEFORE calling
 * this function:
 *
 *   payment_authorized  → void the hold: stripe.paymentIntents.cancel(intentId)
 *                         The admin cancel action in the API route does this automatically.
 *
 *   confirmed + paid    → Stripe does not auto-refund on cancellation.
 *                         Admin must issue a manual refund from the Stripe dashboard
 *                         after cancelling. The admin UI shows a warning for this case.
 *
 *   pending_payment     → No PI exists yet (session only). Stripe's session expiry
 *                         webhook will clean it up automatically.
 */
export async function cancelBooking(id: string, reason?: string): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  const booking = bookings[idx];
  if (!canTransition(booking.status, "cancelled")) {
    throw new Error(`Cannot cancel booking in status "${booking.status}"`);
  }

  const timestamp = now();
  bookings[idx] = {
    ...booking,
    status: "cancelled",
    cancelledAt: timestamp,
    cancellationReason: reason,
    updatedAt: timestamp,
  };
  await writeBookings(bookings);
  await unblockDates(booking); // unblock BEFORE writing so calendar is consistent
  return bookings[idx];
}

/**
 * Mark a confirmed booking as completed (guest has checked out).
 * Dates remain blocked — they were in the past anyway.
 */
export async function completeBooking(id: string): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  const booking = bookings[idx];
  if (!canTransition(booking.status, "completed")) {
    throw new Error(`Cannot complete booking in status "${booking.status}"`);
  }

  bookings[idx] = { ...booking, status: "completed", updatedAt: now() };
  await writeBookings(bookings);
  return bookings[idx];
}

/**
 * Accept a booking request (request_to_book mode).
 *
 * Runs a final server-side availability check before transitioning.
 * Transitions: pending_review → pending_payment
 *
 * The caller (admin route) is responsible for creating the Stripe Checkout Session
 * and emailing the guest the payment link after this function returns.
 *
 * Throws "DATES_UNAVAILABLE" if a conflict is detected (race with another booking).
 */
export async function acceptBookingRequest(id: string): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  const booking = bookings[idx];
  if (booking.status !== "pending_review") {
    throw new Error(`Cannot accept booking in status "${booking.status}"`);
  }

  // Final availability recheck — guards against the race window while the request sat pending
  const avail = await getAvailability();
  const roomData = avail[booking.roomId];
  if (roomData && roomData.units.length > 0) {
    const unitIdx = booking.unitId
      ? roomData.units.findIndex((u) => u.id === booking.unitId)
      : 0;
    const unit = roomData.units[unitIdx >= 0 ? unitIdx : 0];
    const otherBlocks = unit.blockedRanges.filter((r) => r.bookingId !== id);
    if (isRangeBlocked(booking.checkIn, booking.checkOut, otherBlocks)) {
      throw new Error("DATES_UNAVAILABLE");
    }
  }

  const timestamp = now();
  bookings[idx] = {
    ...booking,
    status: "pending_payment",
    updatedAt: timestamp,
    payment: { ...booking.payment, status: "pending" },
  };
  await writeBookings(bookings);
  return bookings[idx];
}

/**
 * Decline a booking request (request_to_book mode).
 *
 * Transitions: pending_review → cancelled
 * No dates were ever blocked, so no unblocking needed.
 *
 * The caller is responsible for notifying the guest.
 */
export async function declineBookingRequest(id: string, reason?: string): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  const booking = bookings[idx];
  if (booking.status !== "pending_review") {
    throw new Error(`Cannot decline booking in status "${booking.status}"`);
  }

  const timestamp = now();
  bookings[idx] = {
    ...booking,
    status: "cancelled",
    cancelledAt: timestamp,
    cancellationReason: reason ?? "Booking request declined by the property",
    updatedAt: timestamp,
  };
  await writeBookings(bookings);
  // No dates to unblock — pending_review bookings never block dates
  return bookings[idx];
}

/**
 * Record a Stripe refund on a booking's payment record.
 *
 * Does NOT change the booking status — the host may refund without cancelling
 * (e.g. a partial goodwill refund) or after the booking has already been cancelled.
 *
 * Full refund  (refundAmount >= totalPrice) → payment.status = "refunded"
 * Partial      (refundAmount < totalPrice)  → payment.status stays "paid";
 *              payment.refundAmount + payment.refundedAt are populated for display.
 *
 * The caller (API route) is responsible for calling stripe.refunds.create() BEFORE
 * calling this function so that our record is only written if Stripe succeeded.
 */
export async function recordRefund(
  id: string,
  refundAmount: number
): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  const booking = bookings[idx];
  const isFullRefund = refundAmount >= booking.totalPrice;

  const timestamp = now();
  bookings[idx] = {
    ...booking,
    updatedAt: timestamp,
    payment: {
      ...booking.payment,
      status: isFullRefund ? "refunded" : booking.payment.status,
      refundedAt: timestamp,
      refundAmount,
    },
  };
  await writeBookings(bookings);
  return bookings[idx];
}

/**
 * Update admin notes on a booking (non-status change, always allowed).
 */
export async function updateAdminNotes(id: string, notes: string): Promise<Booking> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error(`Booking ${id} not found`);

  bookings[idx] = { ...bookings[idx], adminNotes: notes, updatedAt: now() };
  await writeBookings(bookings);
  return bookings[idx];
}
