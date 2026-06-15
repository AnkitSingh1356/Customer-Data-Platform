-- =============================================================
-- Migration: Segments Feature
-- Run: psql -U postgres -d cdp_db -f migration_segments.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS segments (
  id              SERIAL        PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL,
  description     TEXT,
  status          VARCHAR(20)   NOT NULL DEFAULT 'active',
  activity_window VARCHAR(50)   NOT NULL DEFAULT 'All time',
  match_type      VARCHAR(10)   NOT NULL DEFAULT 'all',   -- all | any
  rules           JSONB         NOT NULL DEFAULT '[]',
  member_count    INTEGER       NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_segments_status ON segments(status);

CREATE OR REPLACE FUNCTION update_segments_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_segments_updated_at ON segments;
CREATE TRIGGER trg_segments_updated_at
  BEFORE UPDATE ON segments
  FOR EACH ROW EXECUTE FUNCTION update_segments_updated_at();

-- Seed data matching the screenshots exactly
INSERT INTO segments (name, description, status, activity_window, match_type, rules, member_count, created_at)
VALUES
  ('Recently Active Customers', NULL,                                        'active', 'All time', 'all', '[]', 0,      '2026-05-15'),
  ('SX Active Subscribers',     NULL,                                        'active', 'All time', 'all',
    '[{"field":"customer_type","operator":"equals","value":"B2C Customer"},{"field":"status","operator":"equals","value":"Active"}]',
    0, '2026-04-21'),
  ('Cart Abandoners (Last 7 Days)', 'Real-time segment of customers wh...',  'active', 'All time', 'all',
    '[{"field":"total_orders","operator":"greater_than","value":"0"},{"field":"status","operator":"equals","value":"Active"}]',
    389, '2026-04-09'),
  ('High-Value Repeat Buyers',  'Customers with lifetime value > $50...',    'active', 'All time', 'all',
    '[{"field":"lifetime_value","operator":"greater_than","value":"5000"},{"field":"total_orders","operator":"greater_than","value":"5"}]',
    1247, '2026-04-09'),
  ('Lapsed High Spenders',      'Previously high-value customers (LT...', 'active', 'All time', 'all',
    '[{"field":"lifetime_value","operator":"greater_than","value":"1000"},{"field":"status","operator":"equals","value":"Inactive"}]',
    87,   '2026-04-09'),
  ('Cart Abandoners (7d)',       'Users who abandoned cart in last 7 ...',   'active', 'All time', 'all', '[]', 12450, '2026-04-06'),
  ('Loyalty Program Members',   'Active loyalty program participants',       'active', 'All time', 'all', '[]', 67890, '2026-04-06')
ON CONFLICT DO NOTHING;
