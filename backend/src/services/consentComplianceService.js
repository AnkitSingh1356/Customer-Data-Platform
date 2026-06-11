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

  if (status && status !== "all") {
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

const VALID_STATUSES = ["granted", "revoked", "pending"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createConsentRecord = async (payload) => {
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

  if (!customer_name?.trim() || !customer_email?.trim()) {
    throw Object.assign(new Error("customer_name and customer_email are required."), { status: 400 });
  }
  if (!EMAIL_RE.test(customer_email.trim())) {
    throw Object.assign(new Error("Invalid customer_email format."), { status: 400 });
  }
  if (![marketing_status, analytics_status, personalization_status].every(s => VALID_STATUSES.includes(s))) {
    throw Object.assign(new Error(`Status values must be one of: ${VALID_STATUSES.join(", ")}.`), { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO consent_records
       (customer_name, customer_email, marketing_status, analytics_status,
        personalization_status, source_system, consent_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [customer_name.trim(), customer_email.trim(), marketing_status,
       analytics_status, personalization_status, source_system, consent_version]
    );
    const createdRecord = result.rows[0];

    await client.query(
      `INSERT INTO consent_audit_logs
       (consent_record_id, action_type, new_value, performed_by)
       VALUES ($1,$2,$3,$4)`,
      [createdRecord.id, "CREATE_CONSENT", JSON.stringify(createdRecord), performed_by || "System"]
    );

    await client.query("COMMIT");
    return createdRecord;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

const updateConsentRecord = async (id, payload) => {
  if (![payload.marketing_status, payload.analytics_status, payload.personalization_status].every(s => VALID_STATUSES.includes(s))) {
    throw Object.assign(new Error(`Status values must be one of: ${VALID_STATUSES.join(", ")}.`), { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `WITH old AS (
         SELECT marketing_status, analytics_status, personalization_status
         FROM consent_records WHERE id = $4
       )
       UPDATE consent_records
       SET marketing_status = $1,
           analytics_status = $2,
           personalization_status = $3,
           last_updated = NOW()
       WHERE id = $4
       RETURNING *, (SELECT row_to_json(old) FROM old) AS previous_data`,
      [payload.marketing_status, payload.analytics_status, payload.personalization_status, id]
    );

    if (!result.rows.length) {
      throw Object.assign(new Error("Consent record not found"), { status: 404 });
    }

    const updated = result.rows[0];
    const previous = updated.previous_data;

    await client.query(
      `INSERT INTO consent_audit_logs
       (consent_record_id, action_type, previous_value, new_value, performed_by)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, "UPDATE_CONSENT", JSON.stringify(previous), JSON.stringify(updated), payload.performed_by || "System"]
    );

    await client.query("COMMIT");
    delete updated.previous_data;
    return updated;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

const exportAuditLogs = async ({ limit = 10000 } = {}) => {
  const safeLimit = Math.min(Number(limit) || 10000, 50000);
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
    LIMIT $1
  `;
  const result = await pool.query(query, [safeLimit]);
  return result.rows;
};

const getAllConsentRecords = async ({ limit = 10000 } = {}) => {
  const safeLimit = Math.min(Number(limit) || 10000, 50000);
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
    LIMIT $1
  `;
  const { rows } = await pool.query(query, [safeLimit]);
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
