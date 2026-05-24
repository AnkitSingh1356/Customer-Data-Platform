//backend\src\services\consentComplianceService.js
const pool = require("../config/db");

const getDashboardOverview = async () => {
  const totalQuery = `
    SELECT COUNT(*)::int AS total
    FROM consent_records
  `;

  const grantedQuery = `
    SELECT COUNT(*)::int AS total
    FROM consent_records
    WHERE
      marketing_status = 'granted'
      OR analytics_status = 'granted'
      OR personalization_status = 'granted'
  `;

  const revokedQuery = `
    SELECT COUNT(*)::int AS total
    FROM consent_records
    WHERE
      marketing_status = 'revoked'
      OR analytics_status = 'revoked'
      OR personalization_status = 'revoked'
  `;

  const pendingQuery = `
    SELECT COUNT(*)::int AS total
    FROM consent_records
    WHERE
      marketing_status = 'pending'
      OR analytics_status = 'pending'
      OR personalization_status = 'pending'
  `;

  const policiesQuery = `
    SELECT
      id,
      policy_name,
      policy_type,
      status,
      updated_at
    FROM consent_policies
    ORDER BY updated_at DESC
  `;

  const [
    totalResult,
    grantedResult,
    revokedResult,
    pendingResult,
    policyResult,
  ] = await Promise.all([
    pool.query(totalQuery),
    pool.query(grantedQuery),
    pool.query(revokedQuery),
    pool.query(pendingQuery),
    pool.query(policiesQuery),
  ]);

  const total =
    totalResult.rows[0]?.total || 0;

  const granted =
    grantedResult.rows[0]?.total || 0;

  const revoked =
    revokedResult.rows[0]?.total || 0;

  const pending =
    pendingResult.rows[0]?.total || 0;

  const consentRate =
    total > 0
      ? ((granted / total) * 100).toFixed(1)
      : 0;

  return {
    kpis: {
      overallConsentRate: consentRate,
      pendingRequests: pending,
      activePolicies:
        policyResult.rows.length,
      totalRecords: total,
      granted,
      revoked,
    },

    policies: policyResult.rows,

    chart: [
      {
        name: "Granted",
        value: granted,
        color: "#00b8d4",
      },

      {
        name: "Revoked",
        value: revoked,
        color: "#2E8B57",
      },

      {
        name: "Pending",
        value: pending,
        color: "#5B5B5B",
      },
    ],
  };
};

const getConsentRecords = async ({
  search,
  status,
  page,
  limit,
}) => {
  const offset = (page - 1) * limit;

  const values = [];

  let whereClause = `WHERE 1=1`;

  if (search?.trim()) {
    values.push(`%${search.trim()}%`);

    whereClause += `
      AND (
        customer_name ILIKE $${values.length}
        OR customer_email ILIKE $${values.length}
      )
    `;
  }

  if (status !== "all") {
    values.push(status);

    whereClause += `
      AND (
        marketing_status = $${values.length}
        OR analytics_status = $${values.length}
        OR personalization_status = $${values.length}
      )
    `;
  }

  values.push(limit);

  values.push(offset);

  const dataQuery = `
    SELECT
      id,
      customer_name,
      customer_email,
      marketing_status,
      analytics_status,
      personalization_status,
      source_system,
      consent_version,
      last_updated
    FROM consent_records
    ${whereClause}
    ORDER BY last_updated DESC
    LIMIT $${values.length - 1}
    OFFSET $${values.length}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM consent_records
    ${whereClause}
  `;

  const countValues =
    values.slice(0, values.length - 2);

  const [recordsResult, countResult] =
    await Promise.all([
      pool.query(dataQuery, values),

      pool.query(countQuery, countValues),
    ]);

  const total =
    countResult.rows[0]?.total || 0;

  return {
    rows: recordsResult.rows,

    total,

    totalPages: Math.ceil(total / limit),
  };
};

const createConsentRecord = async (
  payload
) => {
  const {
    customer_name,
    customer_email,
    marketing_status,
    analytics_status,
    personalization_status,
    source_system,
    consent_version,
    performed_by,
  } = payload;

  const query = `
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
    ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `;

  const values = [
    customer_name,
    customer_email,
    marketing_status,
    analytics_status,
    personalization_status,
    source_system,
    consent_version,
  ];

  const result =
    await pool.query(query, values);

  const createdRecord =
    result.rows[0];

  await pool.query(
    `
      INSERT INTO consent_audit_logs
      (
        consent_record_id,
        action_type,
        new_value,
        performed_by
      )
      VALUES
      ($1,$2,$3,$4)
    `,
    [
      createdRecord.id,
      "CREATE_CONSENT",
      JSON.stringify(createdRecord),
      performed_by || "System",
    ]
  );

  return createdRecord;
};

const updateConsentRecord = async (
  id,
  payload
) => {
  const existingQuery = `
    SELECT *
    FROM consent_records
    WHERE id = $1
  `;

  const existing =
    await pool.query(existingQuery, [id]);

  if (!existing.rows.length) {
    throw new Error(
      "Consent record not found"
    );
  }

  const previous =
    existing.rows[0];

  const query = `
    UPDATE consent_records
    SET
      marketing_status = $1,
      analytics_status = $2,
      personalization_status = $3,
      last_updated = NOW()
    WHERE id = $4
    RETURNING *
  `;

  const values = [
    payload.marketing_status,
    payload.analytics_status,
    payload.personalization_status,
    id,
  ];

  const result =
    await pool.query(query, values);

  const updated =
    result.rows[0];

  await pool.query(
    `
      INSERT INTO consent_audit_logs
      (
        consent_record_id,
        action_type,
        previous_value,
        new_value,
        performed_by
      )
      VALUES
      ($1,$2,$3,$4,$5)
    `,
    [
      id,
      "UPDATE_CONSENT",
      JSON.stringify(previous),
      JSON.stringify(updated),
      payload.performed_by || "System",
    ]
  );

  return updated;
};

const exportAuditLogs = async () => {
  const query = `
    SELECT
      l.id,
      r.customer_name,
      l.action_type,
      l.performed_by,
      l.created_at
    FROM consent_audit_logs l
    INNER JOIN consent_records r
      ON r.id = l.consent_record_id
    ORDER BY l.created_at DESC
  `;

  const result =
    await pool.query(query);

  return result.rows;
};
const getAllConsentRecords = async () => {
  const query = `
      SELECT
        customer_name,
        customer_email,
        marketing_status,
        analytics_status,
        personalization_status,
        last_updated
      FROM consent_records
      ORDER BY last_updated DESC
    `;

  const { rows } = await pool.query(query);

  return rows;
};

module.exports = {
  getDashboardOverview,
  getConsentRecords,
  createConsentRecord,
  updateConsentRecord,
  exportAuditLogs,
  getAllConsentRecords,
};
