const db = require("../config/db");

/**
 * Returns aggregate duplicate-detection stats: counts by action status (merged, reviewed,
 * dismissed, needs review) and average confidence score. Active matching rules are loaded
 * at call time so the query always reflects the current rule configuration.
 * Usage: Called by identityResolutionController.getDashboard
 * @returns {Promise<{ totalDuplicates: number, needsReview: number, manualReviewQueue: number, profilesMerged: number, avgConfidence: number, dismissed: number }>}
 */
const getDashboard = async () => {
  const rulesResult = await db.query('SELECT id, is_active FROM identity_resolution_rules');
  const rules = rulesResult.rows;

  // Build WHERE clause dynamically from whichever rules are currently enabled.
  // Rule IDs: 1 = email match, 2 = phone match, 3 = first-name + city match.
  const conditions = [];
  // pg returns numeric columns as strings — use Number() for reliable comparison
  if (rules.find(r => Number(r.id) === 1)?.is_active) conditions.push(`LOWER(c1.email) = LOWER(c2.email)`);
  if (rules.find(r => Number(r.id) === 2)?.is_active) conditions.push(`(c1.phone IS NOT NULL AND c1.phone = c2.phone)`);
  if (rules.find(r => Number(r.id) === 3)?.is_active) conditions.push(`(LOWER(c1.first_name) = LOWER(c2.first_name) AND LOWER(COALESCE(c1.city, '')) = LOWER(COALESCE(c2.city, '')))`);

  // Fall back to '1=0' (match nothing) when no rules are active
  const whereClause = conditions.length > 0 ? conditions.join(' OR ') : '1=0';

  // Self-join on c1.id < c2.id ensures each pair is counted exactly once.
  // LATERAL subquery fetches only the most recent resolution action per pair.
  const dashboardQuery = `
    SELECT
      COUNT(*)                                              AS total_duplicates,
      COUNT(*) FILTER (WHERE irl.action IS NULL)            AS needs_review,
      COUNT(*) FILTER (WHERE irl.action = 'merged')         AS merged,
      COUNT(*) FILTER (WHERE irl.action = 'review')         AS reviewed,
      COUNT(*) FILTER (WHERE irl.action = 'dismissed')      AS dismissed,
      ROUND(
        AVG(irl.confidence_score)
        FILTER (WHERE irl.confidence_score IS NOT NULL), 1
      )                                                     AS avg_confidence
    FROM customers c1
    INNER JOIN customers c2
      ON c1.id < c2.id
    LEFT JOIN LATERAL (
      SELECT action, confidence_score
      FROM identity_resolution_logs
      WHERE customer_id = c1.id
        AND duplicate_customer_id = c2.id
      ORDER BY created_at DESC
      LIMIT 1
    ) irl ON true
    WHERE (${whereClause})
  `;

  const result = await db.query(dashboardQuery);
  const row = result.rows[0];

  return {
    totalDuplicates:  Number(row?.total_duplicates)  || 0,
    needsReview:      Number(row?.needs_review)       || 0,
    manualReviewQueue: Number(row?.reviewed)          || 0,
    profilesMerged:   Number(row?.merged)             || 0,
    avgConfidence:    Number(row?.avg_confidence)     || 0,
    dismissed:        Number(row?.dismissed)          || 0,
  };
};

/**
 * Returns all identity resolution matching rules with their current active state.
 * Usage: Called by identityResolutionController.getRules
 * @returns {Promise<Array<{ id: number, rule_name: string, confidence_score: string, is_active: boolean }>>}
 */
const getRules = async () => {
  const query = `
    SELECT
      id,
      rule_name,
      confidence_score,
      is_active
    FROM identity_resolution_rules
    ORDER BY id ASC
  `;

  const result = await db.query(query);
  return result.rows;
};

/**
 * Toggles the is_active flag on an identity resolution rule and returns the updated row.
 * Usage: Called by identityResolutionController.toggleRule
 * @param {number} id - Rule primary key
 * @returns {Promise<Object>} Updated rule row
 */
const toggleRule = async (id) => {
  const query = `
    UPDATE identity_resolution_rules
    SET is_active = NOT is_active
    WHERE id = $1
    RETURNING *
  `;

  const result = await db.query(query, [id]);
  return result.rows[0];
};

/**
 * Returns paginated duplicate-match pairs with per-pair confidence scores derived from
 * whichever matching rule triggered the match.
 * Usage: Called by identityResolutionController.getMatches
 * @param {Object} opts - Query and pagination options
 * @param {string} opts.search - Partial match on customer or duplicate name/email
 * @param {number} opts.page - Page number (1-based)
 * @param {number} opts.limit - Records per page
 * @returns {Promise<{ rows: Array<Object>, total: number }>} Matched pairs and total count
 */
const getMatches = async ({ search, page, limit }) => {
  const offset = (page - 1) * limit;

  const rulesResult = await db.query('SELECT id, confidence_score, is_active FROM identity_resolution_rules');
  const rules = rulesResult.rows;

  // Confidence score is assigned via CASE matching the same predicate used in
  // the WHERE clause, so each pair gets the score of its triggering rule.
  const conditions = [];
  const caseStatements = [];

  const rule1 = rules.find(r => Number(r.id) === 1);
  if (rule1?.is_active) {
    const score1 = Number(rule1.confidence_score);
    if (!Number.isFinite(score1)) throw new Error("Invalid confidence_score for email rule");
    conditions.push(`LOWER(c1.email) = LOWER(c2.email)`);
    caseStatements.push(`WHEN LOWER(c1.email) = LOWER(c2.email) THEN ${score1}`);
  }

  const rule2 = rules.find(r => Number(r.id) === 2);
  if (rule2?.is_active) {
    const score2 = Number(rule2.confidence_score);
    if (!Number.isFinite(score2)) throw new Error("Invalid confidence_score for phone rule");
    conditions.push(`(c1.phone IS NOT NULL AND c1.phone = c2.phone)`);
    caseStatements.push(`WHEN c1.phone IS NOT NULL AND c1.phone = c2.phone THEN ${score2}`);
  }

  const rule3 = rules.find(r => Number(r.id) === 3);
  if (rule3?.is_active) {
    const score3 = Number(rule3.confidence_score);
    if (!Number.isFinite(score3)) throw new Error("Invalid confidence_score for name rule");
    conditions.push(`(LOWER(c1.first_name) = LOWER(c2.first_name) AND LOWER(COALESCE(c1.city, '')) = LOWER(COALESCE(c2.city, '')))`);
    caseStatements.push(`WHEN LOWER(c1.first_name) = LOWER(c2.first_name) AND LOWER(COALESCE(c1.city, '')) = LOWER(COALESCE(c2.city, '')) THEN ${score3}`);
  }

  const whereClause = conditions.length > 0 ? conditions.join(' OR ') : '1=0';
  const confidenceCase = caseStatements.length > 0 ? `CASE ${caseStatements.join(' ')} ELSE 70 END` : '70';

  const query = `
    WITH duplicate_matches AS (
      SELECT
        c1.id AS customer_id,
        c2.id AS duplicate_customer_id,

        CONCAT(c1.first_name, ' ', c1.last_name) AS customer_name,
        c1.email AS customer_email,

        CONCAT(c2.first_name, ' ', c2.last_name) AS duplicate_name,
        c2.email AS duplicate_email,

        ${confidenceCase} AS confidence_score,

        irl.action,
        irl.created_at AS detected_on

      FROM customers c1
      INNER JOIN customers c2 ON c1.id < c2.id

      LEFT JOIN LATERAL (
        SELECT action, created_at
        FROM identity_resolution_logs
        WHERE customer_id = c1.id AND duplicate_customer_id = c2.id
        ORDER BY created_at DESC
        LIMIT 1
      ) irl ON true

      WHERE (${whereClause})
    )

    SELECT *
    FROM duplicate_matches

    WHERE
      customer_name ILIKE $1
      OR customer_email ILIKE $1
      OR duplicate_name ILIKE $1
      OR duplicate_email ILIKE $1

    ORDER BY detected_on DESC NULLS LAST, confidence_score DESC

    LIMIT $2
    OFFSET $3
  `;

  const countQuery = `
    WITH duplicate_matches AS (
      SELECT
        c1.id AS customer_id,
        CONCAT(c1.first_name, ' ', c1.last_name) AS customer_name,
        c1.email AS customer_email,
        CONCAT(c2.first_name, ' ', c2.last_name) AS duplicate_name,
        c2.email AS duplicate_email

      FROM customers c1
      INNER JOIN customers c2 ON c1.id < c2.id

      LEFT JOIN LATERAL (
        SELECT action, created_at
        FROM identity_resolution_logs
        WHERE customer_id = c1.id AND duplicate_customer_id = c2.id
        ORDER BY created_at DESC
        LIMIT 1
      ) irl ON true

      WHERE (${whereClause})
    )

    SELECT COUNT(*) AS total
    FROM duplicate_matches
    WHERE
      customer_name ILIKE $1
      OR customer_email ILIKE $1
      OR duplicate_name ILIKE $1
      OR duplicate_email ILIKE $1
  `;

  const [matchesResult, countResult] = await Promise.all([
    db.query(query, [`%${search}%`, limit, offset]),
    db.query(countQuery, [`%${search}%`]),
  ]);

  return {
    rows: matchesResult.rows,
    total: Number(countResult.rows[0]?.total) || 0,
  };
};

/**
 * Records a merge decision and marks the duplicate customer as 'Merged' in a single
 * atomic transaction. ON CONFLICT updates an existing log entry so re-merging a pair
 * does not create duplicate audit rows.
 * Usage: Called by identityResolutionController.mergeProfiles
 * @param {Object} opts - Merge parameters
 * @param {number} opts.customerId - Primary customer to retain
 * @param {number} opts.duplicateId - Duplicate customer to soft-delete (status → 'Merged')
 * @param {number} opts.confidenceScore - Confidence score of the triggering match rule
 * @returns {Promise<Object>} The created or updated identity_resolution_logs row
 */
const mergeProfiles = async ({ customerId, duplicateId, confidenceScore }) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const logResult = await client.query(
      `INSERT INTO identity_resolution_logs (customer_id, duplicate_customer_id, confidence_score, action)
       VALUES ($1, $2, $3, 'merged')
       ON CONFLICT (customer_id, duplicate_customer_id) DO UPDATE
         SET action = 'merged', created_at = NOW()
       RETURNING *`,
      [customerId, duplicateId, confidenceScore]
    );

    // Soft-delete the duplicate by status rather than hard DELETE to preserve history
    await client.query(
      `UPDATE customers SET status = 'Merged' WHERE id = $1`,
      [duplicateId]
    );

    await client.query("COMMIT");
    return logResult.rows[0];
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

module.exports = {
  getDashboard,
  getRules,
  toggleRule,
  getMatches,
  mergeProfiles,
};
