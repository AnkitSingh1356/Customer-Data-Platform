-- =============================================================
-- Migration: Authentication & User Profile
-- Run: psql -U postgres -d cdp_db -f migration_auth.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS users (
  id             SERIAL        PRIMARY KEY,
  full_name      VARCHAR(150)  NOT NULL,
  email          VARCHAR(255)  UNIQUE NOT NULL,
  password_hash  TEXT          NOT NULL,
  role           VARCHAR(30)   NOT NULL DEFAULT 'admin',
    -- admin | marketing | compliance
  avatar_initials VARCHAR(3)   GENERATED ALWAYS AS (
    UPPER(LEFT(full_name, 1))
  ) STORED,
  department     VARCHAR(100),
  phone          VARCHAR(40),
  last_login     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ   DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_users_updated_at();
