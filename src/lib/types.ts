// ─── Property Content Model ───────────────────────────────────────────

export interface PropertyContent {
  identity: PropertyIdentity;
  hero: HeroContent;
  description: DescriptionContent;
  gallery: GalleryItem[];
  rooms: RoomUnit[];
  amenities: Amenity[];
  reviews: Review[];
  faq: FAQItem[];
  location: LocationContent;
  nearbyAttractions: NearbyAttraction[];
  policies: PoliciesContent;
  contact: ContactInfo;
  seo: SEOContent;
}

export interface PropertyIdentity {
  slug: string;
  name: string;
  propertyType: "villa" | "hostel" | "apartment" | "homestay" | "guesthouse";
  location: string;
  country: string;
}

export interface HeroContent {
  headline: string;
  tagline: string;
  intro: string;
  image: string;
  primaryCTA: CTAButton;
  secondaryCTA: CTAButton;
}

export interface CTAButton {
  label: string;
  url: string;
}

export interface DescriptionContent {
  short: string;
  long: string;
}

export interface GalleryItem {
  url: string;
  alt: string;
}

// ─── Room Unit (first-class entity) ──────────────────────────────────

export interface RoomUnit {
  id: string;
  name: string;
  shortDescription?: string;
  description: string;
  image: string;
  gallery?: GalleryItem[];
  capacity: number;
  bedType?: string;
  bathroomType?: string;
  size?: string;
  priceFrom?: string;
  highlights?: string[];
  amenities?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  isFeatured?: boolean;
  displayOrder?: number;
}

export interface Amenity {
  icon?: string;
  label: string;
}

export interface Review {
  author: string;
  text: string;
  rating: number;
  country?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface LocationContent {
  areaName: string;
  mapUrl: string;
  description: string;
}

export interface NearbyAttraction {
  name: string;
  description: string;
  travelTime?: string;
}

export interface PoliciesContent {
  checkIn: string;
  checkOut: string;
  cancellation: string;
  notes: string[];
}

export interface ContactInfo {
  whatsapp?: string;
  email?: string;
  phone?: string;
  /**
   * Custom CTA buttons shown in the Contact section and footer.
   * Admin can add up to 4 buttons with any label and URL
   * (e.g. "Book on Booking.com", "View on Airbnb", "Book on our app", etc.)
   */
  ctaButtons?: CTAButton[];
}

export interface SEOContent {
  title: string;
  description: string;
  ogImage: string;
}

// ─── Branding Config ──────────────────────────────────────────────────

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo?: string;
  buttonStyle: "rounded" | "pill" | "square";
  fontStyle: "serif" | "modern" | "minimal";
  /** Public-page layout preset. Premium presets require premiumLayouts: true in config. */
  layoutPreset?: "default" | "editorial" | "resort";
}

// ─── Section Visibility Config ────────────────────────────────────────

export interface SectionVisibility {
  hero: boolean;
  bookingCta: boolean;
  about: boolean;
  gallery: boolean;
  rooms: boolean;
  amenities: boolean;
  reviews: boolean;
  faq: boolean;
  location: boolean;
  nearbyAttractions: boolean;
  policies: boolean;
  contactCta: boolean;
  footer: boolean;
}

// ─── Property Config ──────────────────────────────────────────────────

export interface PropertyConfig {
  slug: string;
  name: string;
  propertyType: "villa" | "hostel" | "apartment" | "homestay" | "guesthouse";
  location: string;
  country: string;
  /**
   * IANA timezone identifier for the property's physical location.
   * Used to display check-in/out times correctly for guests.
   * Examples: "Asia/Makassar" (Bali), "Europe/Lisbon", "America/New_York"
   * Full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   * Defaults to "UTC" if not set.
   */
  timezone?: string;
  defaultLocale: string;
  enabledLocales: string[];
  /** Email address for admin notifications (booking alerts, system messages). */
  adminEmail: string;
  /** Unlocks premium layout presets (editorial, resort) in the Branding admin. */
  premiumLayouts?: boolean;
}

// ─── Booking Config ───────────────────────────────────────────────────

/**
 * instant_book    — Guest pays via Stripe → auto-confirmed. Calendar is single source of truth.
 * request_to_book — Guest submits request (no payment) → admin accepts/declines →
 *                   if accepted, guest receives a payment link → pays → confirmed.
 */
export type BookingMode = "instant_book" | "request_to_book";

export interface BookingConfig {
  mode: BookingMode;
  /** Currency code shown in price displays (e.g. "USD", "EUR", "IDR"). */
  currency: string;
  /** Label for the booking CTA button on the public page. */
  ctaLabel: string;
  /** Preferred fallback contact channel for manual enquiries. */
  contactMethod: "email" | "whatsapp";
  /** Email address for booking enquiries (fallback contact + admin notifications). */
  bookingEmail: string;
  /** WhatsApp number for booking enquiries (fallback contact). */
  bookingWhatsapp: string;
}

// ─── Availability (internal mode only) ───────────────────────────────

export interface BlockedRange {
  from: string;           // "YYYY-MM-DD"
  to: string;             // "YYYY-MM-DD" last night (inclusive) — check-out day is NOT blocked
  bookingId?: string;     // set when this range was created by a booking; used to unblock on cancel
  icalSourceId?: string;  // set when imported from an iCal feed; used to refresh on re-sync
  icalEventId?: string;   // UID from the iCal event; used for deduplication
  icalSummary?: string;   // event summary from the iCal feed (e.g. "Reserved", "Airbnb")
}

export interface PricePeriod {
  from: string;
  to: string;
  pricePerNight: number;
  label?: string; // e.g. "High Season", "Christmas"
}

/**
 * An external iCal calendar feed to import blocked dates from.
 * Stored per room unit so each physical listing can have its own external calendar.
 */
export interface ICalSyncSource {
  id: string;                               // UUID — stable identifier for this source
  label: string;                            // Human-readable name, e.g. "Airbnb", "Booking.com"
  url: string;                              // The iCal URL to fetch (webcal:// or https://)
  lastSyncedAt?: string;                    // ISO timestamp of last sync attempt
  lastSyncStatus?: "ok" | "error" | "never" | "empty_warning"; // Result of last sync
  lastSyncError?: string;                   // Error message if last sync failed
}

/**
 * One physical unit of a room type (e.g. "Room 101", "Room 102").
 * A room type can have many units; each unit tracks its own blocked dates.
 * Pricing, minStay, and pricePeriods are shared across all units of a type.
 */
export interface RoomUnitAvailability {
  id: string;                     // e.g. "room-1-u1", "room-1-u2"
  blockedRanges: BlockedRange[];
  /** External iCal feeds to import blocked dates from (external mode). */
  icalSources?: ICalSyncSource[];
}

export interface RoomAvailability {
  pricePerNight: number;
  minStay: number;
  pricePeriods: PricePeriod[];
  /** Physical units of this room type. At least one unit is required. */
  units: RoomUnitAvailability[];
}

/** Keyed by room id */
export type AvailabilityData = Record<string, RoomAvailability>;

// ─── Booking Domain ───────────────────────────────────────────────────────────

/**
 * Status lifecycle:
 *
 *  V1 (auto-confirm):
 *    direct creation → confirmed → [cancelled | completed]
 *
 *  V2 (manual confirmation):
 *    direct creation → pending_confirmation → confirmed → [cancelled | completed]
 *
 *  V2 (payments):
 *    direct creation → pending_payment → confirmed → [cancelled | completed]
 *                                     ↘ payment_failed → [pending_payment | cancelled | expired]
 *
 * Terminal states: cancelled, expired, completed — no further transitions allowed.
 */
export type BookingStatus =
  | "pending_review"        // request_to_book: awaiting admin accept/decline
  | "pending_confirmation"  // awaiting manual admin confirmation (legacy)
  | "confirmed"             // dates are blocked, booking is active
  | "pending_payment"       // awaiting payment before confirmation
  | "payment_failed"        // payment attempt failed
  | "payment_authorized"    // payment authorized (held), confirming — transient state in webhook
  | "rejected"              // conflict detected after auth — authorization voided, terminal
  | "cancelled"             // cancelled by guest or admin — terminal
  | "expired"               // timed out without payment/confirmation — terminal
  | "completed";            // stay is over — terminal

/** One pricing segment in the cost breakdown (e.g. "High Season: 3 nights × $520"). */
export interface PriceLineItem {
  label: string;        // "Base Rate" | "High Season" | custom period label
  from: string;         // first night of this segment
  to: string;           // last night of this segment
  nights: number;
  pricePerNight: number;
  subtotal: number;
}

export interface BookingGuest {
  name: string;
  email: string;
  phone?: string;
  adults: number;
  children: number;
  notes?: string;
}

/**
 * Payment sub-record — always present, always "none" in V1.
 * Stripe populates sessionId at creation, intentId after payment completes.
 */
export interface BookingPayment {
  status: "none" | "pending" | "authorized" | "paid" | "refunded" | "failed";
  method?: string;      // "stripe" | "paypal" | "bank_transfer" | …
  /**
   * Stripe Checkout Session ID (cs_...).
   * Stored immediately after session creation. Links to the Stripe dashboard payment page.
   */
  sessionId?: string;
  /**
   * Stripe PaymentIntent ID (pi_...).
   * Stored after checkout.session.completed. Required for refunds and dispute management.
   */
  intentId?: string;
  paidAt?: string;
  amount?: number;
  currency?: string;
  refundedAt?: string;
  refundAmount?: number;
}

export interface Booking {
  id: string;               // UUID
  confirmationCode: string; // human-readable, e.g. "2604-XKMN7R"
  createdAt: string;
  updatedAt: string;

  // ── Room & dates ─────────────────────────────────────────────────────
  roomId: string;
  /** The specific physical unit booked (e.g. "room-1-u2"). Present on all new bookings. */
  unitId?: string;
  roomName: string;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD (departure — exclusive, NOT a blocked night)
  nights: number;

  // ── Price snapshot (captured at booking creation, never recalculated) ─
  currency: string;
  priceBreakdown: PriceLineItem[];
  totalPrice: number;

  // ── Guest ────────────────────────────────────────────────────────────
  guest: BookingGuest;

  // ── Status & flow ────────────────────────────────────────────────────
  status: BookingStatus;
  source: "direct" | "admin" | "airbnb" | "booking_com";
  /** "request" = request_to_book (admin accepts → payment); "payment" = instant_book (pay → auto-confirm); "auto" / "manual" = legacy */
  confirmationMode: "auto" | "manual" | "payment" | "request";

  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  // ── Payment (V1: { status: "none" }, V2 populates the rest) ─────────
  payment: BookingPayment;

  // ── Admin & notifications ────────────────────────────────────────────
  adminNotes?: string;
  notifications: {
    confirmationSentAt?: string;
    reminderSentAt?: string;
  };
}

/**
 * Pre-computed data passed from the room calendar into the booking widget
 * so the guest skips the search step and lands directly on the booking form.
 */
export interface BookingPrefill {
  room: RoomUnit;
  checkIn: string;
  checkOut: string;
  nights: number;
  priceBreakdown: PriceLineItem[];
  totalPrice: number;
  avgPricePerNight: number;
  minStay: number;
}

// ─── Resolved Property (all configs + locale content merged) ──────────

export interface ResolvedProperty {
  config: PropertyConfig;
  branding: BrandingConfig;
  sections: SectionVisibility;
  content: PropertyContent;
  booking: BookingConfig;
}
