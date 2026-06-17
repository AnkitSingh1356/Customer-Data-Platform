CREATE TABLE IF NOT EXISTS promotional_campaigns (
    id SERIAL PRIMARY KEY,

    campaign_name VARCHAR(255) NOT NULL,

    status VARCHAR(50) NOT NULL,

    campaign_type VARCHAR(100) NOT NULL,

    total_budget NUMERIC(12,2) NOT NULL DEFAULT 0,

    spent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    audience_size INTEGER NOT NULL DEFAULT 0,

    conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,

    start_date DATE,

    end_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO promotional_campaigns (
    campaign_name,
    status,
    campaign_type,
    total_budget,
    spent_amount,
    audience_size,
    conversion_rate,
    start_date,
    end_date
)
VALUES
(
    'Spring Golf Collection Launch',
    'active',
    'Sms',
    35000,
    18200,
    89200,
    8.7,
    '2026-03-27',
    '2026-04-26'
),
(
    'New Customer Welcome Series',
    'active',
    'Email',
    10000,
    4500,
    15600,
    22.1,
    '2026-03-07',
    '2026-06-05'
),
(
    'Re-engagement Campaign',
    'draft',
    'Email',
    25000,
    0,
    34500,
    0,
    NULL,
    NULL
),
(
    'Q4 Holiday Sale - Tennis',
    'active',
    'Email',
    50000,
    32500,
    125430,
    12.3,
    '2026-03-22',
    '2026-04-21'
),
(
    'Loyalty Rewards Double Points',
    'completed',
    'Email',
    20000,
    20000,
    67890,
    15.2,
    '2026-02-20',
    '2026-03-22'
);
