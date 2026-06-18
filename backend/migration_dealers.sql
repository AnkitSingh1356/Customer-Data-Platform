-- =============================================================
-- Migration: Dealer Network
-- Run: psql -U postgres -d cdp_db -f migration_dealers.sql
-- =============================================================

-- ── dealers ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dealers (
  id             SERIAL        PRIMARY KEY,
  name           VARCHAR(200)  NOT NULL,
  code           VARCHAR(50)   UNIQUE NOT NULL,
  parent_code    VARCHAR(50),                        
  type           VARCHAR(20)   NOT NULL DEFAULT 'Branch',
  tier           VARCHAR(20)   NOT NULL DEFAULT 'standard',
  region         VARCHAR(100)  NOT NULL,
  city           VARCHAR(100),
  country        VARCHAR(10),
  email          VARCHAR(255),
  phone          VARCHAR(50),
  status         VARCHAR(20)   NOT NULL DEFAULT 'Active',
  data_owner     VARCHAR(100),
  annual_revenue NUMERIC(15,2) DEFAULT 0,
  contacts       INTEGER       DEFAULT 0,
  steward_uuid   VARCHAR(100),
  created_at     TIMESTAMPTZ   DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dealers_parent  ON dealers(parent_code);
CREATE INDEX IF NOT EXISTS idx_dealers_region  ON dealers(region);
CREATE INDEX IF NOT EXISTS idx_dealers_code    ON dealers(code);

CREATE TABLE IF NOT EXISTS dealer_reps (
  id            SERIAL       PRIMARY KEY,
  dealer_code   VARCHAR(50)  NOT NULL REFERENCES dealers(code) ON DELETE CASCADE,
  name          VARCHAR(150) NOT NULL,
  title         VARCHAR(100),
  region        VARCHAR(100),
  email         VARCHAR(255),
  phone         VARCHAR(50),
  visits_30d    INTEGER      DEFAULT 0,
  orders_30d    INTEGER      DEFAULT 0,
  last_visit    DATE,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dealer_reps_code ON dealer_reps(dealer_code);

CREATE TABLE IF NOT EXISTS dealer_access_requests (
  id            SERIAL       PRIMARY KEY,
  dealer_code   VARCHAR(50)  NOT NULL REFERENCES dealers(code) ON DELETE CASCADE,
  target_uuid   VARCHAR(100) NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_access_req_code ON dealer_access_requests(dealer_code);

CREATE OR REPLACE FUNCTION update_dealers_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_dealers_updated_at ON dealers;
CREATE TRIGGER trg_dealers_updated_at
  BEFORE UPDATE ON dealers FOR EACH ROW EXECUTE FUNCTION update_dealers_updated_at();

INSERT INTO dealers (name,code,parent_code,type,tier,region,city,country,email,phone,status,data_owner,annual_revenue,contacts)
VALUES

('Dunlop Sports APAC HQ',         'DSP-AP-HQ', NULL,        'HQ',     'gold',     'APAC',         'Kobe',    'JP', 'apac@dunlopsports.com',       '+81-78-5555-0100', 'Active', 'APAC Ops',     7400000,  4),
('Dunlop Sports EMEA HQ',         'DSP-EU-HQ', NULL,        'HQ',     'platinum', 'EMEA',         'London',  'GB', 'emea@dunlopsports.com',       '+44-20-5555-0100', 'Active', 'EMEA Ops',     9800000,  4),
('Dunlop Sports LATAM HQ',        'DSP-LA-HQ', NULL,        'HQ',     'silver',   'LATAM',        'Miami',   'US', 'latam@dunlopsports.com',      '+1-305-5555-0100', 'Active', 'LATAM Ops',    3200000,  4),
('Dunlop Sports North America HQ','DSP-NA-HQ', NULL,        'HQ',     'platinum', 'North America','New York','US', 'na@dunlopsports.com',         '+1-212-5555-0100', 'Active', 'NA Ops',       12500000, 4),
('Dunlop Sports - Sydney Branch', 'DSP-AP-SYD','DSP-AP-HQ','Branch','standard', 'APAC',         'Sydney',  'AU', 'Sydney@DunlopSports.Com',     '+61-2-5555-0157',  'Active', 'Regional Ops', 1400000,  0),
('Dunlop Sports - Tokyo Branch',  'DSP-AP-TYO','DSP-AP-HQ','Branch','gold',     'APAC',         'Tokyo',   'JP', 'tokyo@dunlopsports.com',      '+81-3-5555-0200',  'Active', 'Regional Ops', 2900000,  0),
-- EMEA Branches
('Dunlop Sports - London Branch', 'DSP-EU-LON','DSP-EU-HQ','Branch','gold',     'EMEA',         'London',  'GB', 'london@dunlopsports.com',     '+44-20-5555-0200', 'Active', 'Regional Ops', 3100000,  5),
('Dunlop Sports - Munich Branch', 'DSP-EU-MUC','DSP-EU-HQ','Branch','standard', 'EMEA',         'Munich',  'DE', 'munich@dunlopsports.com',     '+49-89-5555-0300', 'Active', 'Regional Ops', 2200000,  5),
('Dunlop Sports - Paris Branch',  'DSP-EU-PAR','DSP-EU-HQ','Branch','standard', 'EMEA',         'Paris',   'FR', 'paris@dunlopsports.com',      '+33-1-5555-0400',  'Active', 'Regional Ops', 1700000,  0),
-- LATAM Branches
('Dunlop Sports - Sao Paulo Branch','DSP-LA-SAO','DSP-LA-HQ','Branch','standard','LATAM',       'Sao Paulo','BR','saopaulo@dunlopsports.com',  '+55-11-5555-0100', 'Active', 'Regional Ops', 1800000,  0),
-- North America Branches
('Dunlop Sports - Chicago Branch','DSP-NA-CHI','DSP-NA-HQ','Branch','gold',     'North America','Chicago', 'US', 'chicago@dunlopsports.com',    '+1-312-5555-0100', 'Active', 'Regional Ops', 4200000,  0),
('Dunlop Sports - LA Branch',     'DSP-NA-LAX','DSP-NA-HQ','Branch','platinum', 'North America','Los Angeles','US','la@dunlopsports.com',      '+1-310-5555-0100', 'Active', 'Regional Ops', 5800000,  0)
ON CONFLICT (code) DO NOTHING;

-- Seed reps for Sydney Branch
INSERT INTO dealer_reps (dealer_code,name,title,region,email,phone,visits_30d,orders_30d,last_visit)
VALUES
('DSP-AP-SYD','Morgan Hayes',  'Field Sales Rep',   'APAC','morgan.hayes@clevelandgolf.com',  '+1 (555) 151-3451',7,4, '2026-05-04'),
('DSP-AP-SYD','Parker Carter', 'Account Executive', 'APAC','parker.carter@clevelandgolf.com', '+1 (555) 158-3458',14,2,'2026-04-27'),
('DSP-AP-SYD','Casey Jensen',  'Account Executive', 'APAC','casey.jensen@clevelandgolf.com',  '+1 (555) 165-3465',21,9,'2026-05-18'),
('DSP-AP-SYD','Alex Rivera',   'Territory Manager', 'APAC','alex.rivera@clevelandgolf.com',   '+1 (555) 172-3472',5,1, '2026-05-10')
ON CONFLICT DO NOTHING;
