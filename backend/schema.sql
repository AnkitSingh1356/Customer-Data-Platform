//cdp-bulk-upload\cdp-backend\schema.sql
CREATE TABLE IF NOT EXISTS customers (
  id               SERIAL        PRIMARY KEY,
  cdp_id           VARCHAR(20)   UNIQUE NOT NULL,
  first_name       VARCHAR(100)  NOT NULL,
  last_name        VARCHAR(100),
  email            VARCHAR(255)  UNIQUE NOT NULL,
  phone            VARCHAR(30),
  customer_type    VARCHAR(50)   DEFAULT 'B2C Customer',
  primary_source   VARCHAR(100),
  status           VARCHAR(20)   DEFAULT 'Active',
  dealer_code      VARCHAR(50),
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bulk_upload_jobs (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  filename       VARCHAR(255)  NOT NULL,
  status         VARCHAR(20)   NOT NULL DEFAULT 'pending',

  total_rows     INTEGER       DEFAULT 0,
  success_count  INTEGER       DEFAULT 0,
  failed_count   INTEGER       DEFAULT 0,
  error_log      JSONB         DEFAULT '[]'::jsonb,
  created_at     TIMESTAMPTZ   DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS upload_errors (
  id         SERIAL        PRIMARY KEY,
  job_id     UUID          REFERENCES bulk_upload_jobs(id) ON DELETE CASCADE,
  row_number INTEGER       NOT NULL,
  row_data   JSONB,
  error_msg  TEXT          NOT NULL,
  created_at TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email        ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status       ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_type         ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_status       ON bulk_upload_jobs(status);
CREATE INDEX IF NOT EXISTS idx_upload_errors_job_id   ON upload_errors(job_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
