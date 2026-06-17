CREATE TABLE IF NOT EXISTS consent_policies (
    id SERIAL PRIMARY KEY,

    policy_name VARCHAR(255) NOT NULL,

    policy_type VARCHAR(100) NOT NULL,

    status VARCHAR(50) DEFAULT 'Active',

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consent_records (
    id SERIAL PRIMARY KEY,

    customer_name VARCHAR(255) NOT NULL,

    customer_email VARCHAR(255) NOT NULL UNIQUE,

    marketing_status VARCHAR(50) DEFAULT 'none',

    analytics_status VARCHAR(50) DEFAULT 'none',

    personalization_status VARCHAR(50) DEFAULT 'none',

    source_system VARCHAR(100),

    consent_version VARCHAR(50),

    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consent_audit_logs (
    id SERIAL PRIMARY KEY,

    consent_record_id INTEGER REFERENCES consent_records(id) ON DELETE CASCADE,

    action_type VARCHAR(100) NOT NULL,

    previous_value JSONB,

    new_value JSONB,

    performed_by VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consent_customer_name
ON consent_records(customer_name);

CREATE INDEX idx_consent_customer_email
ON consent_records(customer_email);

CREATE INDEX idx_consent_marketing_status
ON consent_records(marketing_status);

CREATE INDEX idx_consent_analytics_status
ON consent_records(analytics_status);

CREATE INDEX idx_consent_personalization_status
ON consent_records(personalization_status);

INSERT INTO consent_policies
(policy_name, policy_type)
VALUES
('CCPA - California Consumer Privacy', 'privacy'),
('Global Marketing Consent Policy', 'consent'),
('GDPR Data Processing Agreement', 'privacy'),
('Cookie Consent Policy', 'consent');

INSERT INTO consent_records
(
    customer_name,
    customer_email,
    marketing_status,
    analytics_status,
    personalization_status,
    source_system,
    consent_version
)
VALUES
(
    'John Snow',
    'john.snow@tennis.com',
    'revoked',
    'granted',
    'granted',
    'SAP',
    'v2.1'
),
(
    'Arya Stark',
    'arya.stark@golf.com',
    'granted',
    'pending',
    'granted',
    'Commerce Cloud',
    'v2.0'
),
(
    'Sansa Stark',
    'sansa.stark@sports.com',
    'granted',
    'none',
    'granted',
    'SAP',
    'v1.8'
),
(
    'Raven',
    'raven.stark@email.com',
    'revoked',
    'revoked',
    'revoked',
    'Paycom',
    'v2.3'
);
