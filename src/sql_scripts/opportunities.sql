-- ============================================================
-- Opportunity Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunity_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial categories
INSERT INTO opportunity_categories (name, slug, sort_order) VALUES
  ('Transportation', 'transportation', 1),
  ('Hospitality',    'hospitality',    2),
  ('F&B',           'fnb',            3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Opportunities
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id       UUID REFERENCES opportunity_categories(id) ON DELETE SET NULL,

  -- Content
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  tagline           TEXT,
  description       TEXT,

  -- Financials
  min_investment    NUMERIC,
  target_irr        NUMERIC,           -- annualised %
  tenure            TEXT,              -- e.g. "3 years"
  total_pool_size   NUMERIC,
  filled_pct        NUMERIC,           -- null = auto-calc from pool

  -- Links
  pool_id           UUID REFERENCES company_pools(purchase_id) ON DELETE SET NULL,
  company_name      TEXT,              -- fallback when no pool linked

  -- Media
  image_url         TEXT,
  brochure_url      TEXT,

  -- Visibility
  is_public         BOOLEAN NOT NULL DEFAULT false,
  is_for_investor   BOOLEAN NOT NULL DEFAULT false,

  -- Status: draft | active | coming_soon | closed | archived
  status            TEXT NOT NULL DEFAULT 'draft',

  -- Detail page link (now auto-generated as /opportunities/[category]/[slug])
  detail_url        TEXT,

  -- Detail page content
  hero_metrics      JSONB,   -- [{label, value, highlight}]
  highlights        JSONB,   -- [{icon, title, desc}]
  deal_terms        JSONB,   -- [{label, value}]
  timeline          JSONB,   -- [{date, title, desc, status}]
  partners          JSONB,   -- [{name, logo_url, tag}]
  capital_structure JSONB,   -- {equity_pct, debt_pct, equity_amount, debt_amount, monthly_emi, total_size}
  whatsapp_number   TEXT,
  gallery_folder_id TEXT,    -- Google Drive folder ID for photo gallery
  gallery_urls      JSONB,   -- ["/varanasi/photo-1.png", ...] fallback for local/static images
  market_stats      JSONB,   -- [{value, label, sub, dark}] — stats grid in market thesis section
  amenities         JSONB,   -- [{label, sub}] — property amenities list
  map_embed_url     TEXT,    -- Google Maps embed URL
  timeline_title    TEXT,    -- e.g. "Zostel Launch Roadmap" (default: "Deployment Schedule")
  cta_title         TEXT,    -- e.g. "Don't Miss the Kashi Wave"
  cta_description   TEXT,    -- CTA body copy

  -- Business model / ROI calculator
  -- formula_type: "transport" | "fnb" | "hospitality"
  financial_model   JSONB,

  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migration: run these if table already exists
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS hero_metrics      JSONB;
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS highlights        JSONB;
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS deal_terms        JSONB;
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS timeline          JSONB;
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS partners          JSONB;
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS capital_structure JSONB;
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS whatsapp_number   TEXT;
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gallery_folder_id TEXT;
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS gallery_urls      JSONB;
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS market_stats      JSONB;
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS amenities         JSONB;
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS map_embed_url     TEXT;
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS financial_model   JSONB;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: public read for active+public rows; admin full access via service role
ALTER TABLE opportunity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active categories"
  ON opportunity_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "public read active public opportunities"
  ON opportunities FOR SELECT
  USING (status = 'active' AND is_public = true);
