-- ============================================================
-- Supabase setup script for the Accommodation Website Template
-- ============================================================
-- Run this entire script in: Supabase → SQL Editor → New query
-- It is safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT).
-- ============================================================


-- ─── 1. Property data table ───────────────────────────────────────────────────
-- Replaces Vercel Blob. Stores all property content as JSON text rows.
-- One row per data key (config, branding, sections, booking, content_en, etc.)

CREATE TABLE IF NOT EXISTS property_data (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (no public access — service role key bypasses RLS)
ALTER TABLE property_data ENABLE ROW LEVEL SECURITY;

-- No public policies: only the server-side service role key can read/write.
-- If you ever add client-side Supabase usage, add explicit policies here.


-- ─── 2. Seed data ────────────────────────────────────────────────────────────
-- Default values that match the demo template.
-- The admin panel overwrites these after first login.
-- Uses ON CONFLICT DO NOTHING so re-running this script is safe.

INSERT INTO property_data (key, value) VALUES

('config', '{
  "slug": "villa-amara-bali",
  "name": "Villa Amara",
  "propertyType": "villa",
  "location": "Ubud, Bali",
  "country": "Indonesia",
  "timezone": "Asia/Makassar",
  "defaultLocale": "en",
  "enabledLocales": ["en"],
  "adminEmail": "",
  "premiumLayouts": true
}'),

('branding', '{
  "primaryColor": "#296546",
  "secondaryColor": "#c9a96e",
  "accentColor": "#e8634a",
  "logo": "",
  "buttonStyle": "rounded",
  "fontStyle": "serif",
  "layoutPreset": "default"
}'),

('sections', '{
  "hero": true,
  "bookingCta": true,
  "about": true,
  "gallery": true,
  "rooms": true,
  "amenities": true,
  "reviews": true,
  "faq": true,
  "location": true,
  "nearbyAttractions": true,
  "policies": true,
  "contactCta": true,
  "footer": true
}'),

('booking', '{
  "mode": "instant_book",
  "currency": "USD",
  "ctaLabel": "Check Availability",
  "contactMethod": "email",
  "bookingEmail": "",
  "bookingWhatsapp": ""
}'),

('availability', '{}'),

('bookings', '[]')

ON CONFLICT (key) DO NOTHING;

-- Note: content_en (the page text) is NOT seeded here because it is large.
-- On first boot, the app reads it from the bundled src/content/property/locales/en.json
-- seed file and automatically writes it to this table.


-- ─── 3. Uploads storage bucket ───────────────────────────────────────────────
-- Public bucket for admin-uploaded images (hero, gallery, rooms, logo).
-- Files get a permanent public URL with no expiry.

INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all uploaded images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Public read access for uploads'
  ) THEN
    CREATE POLICY "Public read access for uploads"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'uploads');
  END IF;
END $$;

-- Allow service role (server-side) to upload/delete
-- (Service role bypasses RLS, so no explicit policy needed for INSERT/DELETE)


-- ─── Done ─────────────────────────────────────────────────────────────────────
-- After running this script:
-- 1. Copy SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from
--    Project Settings → API → Project URL / service_role key
-- 2. Add both to your Vercel environment variables
-- 3. Deploy — the app will use Supabase automatically
