-- =============================================================
-- Migration: Customer Profile Feature
-- Run AFTER the base schema.sql:
--   psql -U postgres -d cdp_db -f migration_profile.sql
-- =============================================================

-- ── Extra columns on customers ─────────────────────────────────
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS city            VARCHAR(100),
  ADD COLUMN IF NOT EXISTS country         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS channel         VARCHAR(50)   DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS total_orders    INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_value  NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consent_status  VARCHAR(30)   DEFAULT 'opted in',
  ADD COLUMN IF NOT EXISTS data_owner      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS quality_score   INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags            TEXT[]        DEFAULT '{}';

-- ── dealer_affiliations ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dealer_affiliations (
  id            SERIAL        PRIMARY KEY,
  customer_id   INTEGER       NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  dealer_name   VARCHAR(200)  NOT NULL,
  dealer_code   VARCHAR(50),
  region        VARCHAR(100),
  role          VARCHAR(100),
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dealer_aff_customer ON dealer_affiliations(customer_id);

-- ── data_quality_issues ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_quality_issues (
  id            SERIAL        PRIMARY KEY,
  customer_id   INTEGER       NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title         VARCHAR(200)  NOT NULL,
  description   TEXT,
  severity      VARCHAR(20)   DEFAULT 'MEDIUM',   -- LOW | MEDIUM | HIGH
  resolved      BOOLEAN       DEFAULT FALSE,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dqi_customer ON data_quality_issues(customer_id);

-- ── flexible_attributes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flexible_attributes (
  id            SERIAL        PRIMARY KEY,
  customer_id   INTEGER       NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  attr_type     VARCHAR(50)   DEFAULT 'Behavioral',
  attr_key      VARCHAR(200)  NOT NULL,
  attr_value    TEXT          NOT NULL,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_flex_attr_customer ON flexible_attributes(customer_id);

-- ── Update stats query to use real lifetime_value ──────────────
-- (The getStats() service function already references lifetime_value;
--  no SQL change needed here — the column now exists.)
