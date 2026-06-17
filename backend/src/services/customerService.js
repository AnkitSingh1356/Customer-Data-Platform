const pool = require("../config/db");
const { RESTRICTED_CUSTOMER_TYPES } = require("../config/constants");

// Returns a paginated customer list; non-admin restricted viewers see only
// their own customer_type — returns { customers, total, page, limit }
async function getCustomers({
  type,
  status,
  source,
  search,
  page = 1,
  limit = 20,
  viewerRole,
  viewerCustomerType,
}) {
  const conditions = [];
  const params = [];
  let p = 1;

  // Restrict non-admin users in sensitive types to their own customer_type scope
  const isRestricted = viewerRole !== "admin" && RESTRICTED_CUSTOMER_TYPES.has(viewerCustomerType);

  if (isRestricted) {
    conditions.push(`customer_type ILIKE $${p++}`);
    params.push(viewerCustomerType);
  } else if (type && type !== "all") {
    conditions.push(`customer_type ILIKE $${p++}`);
    params.push(type);
  }
  if (status && status !== "all") {
    conditions.push(`status ILIKE $${p++}`);
    params.push(status);
  }
  if (source && source !== "all") {
    conditions.push(`primary_source ILIKE $${p++}`);
    params.push(source);
  }

  if (search) {
    conditions.push(
      `(first_name ILIKE $${p} OR last_name ILIKE $${p} OR
        email ILIKE $${p} OR cdp_id ILIKE $${p} OR
        phone ILIKE $${p} OR dealer_code ILIKE $${p})`,
    );
    params.push(`%${search}%`);
    p++;
  }

  const where     = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  // Cap page size at 200 to avoid unbounded result sets
  const safeLimit = Math.min(Math.max(parseInt(limit || "20", 10), 1), 200);
  const offset    = (Math.max(parseInt(page || "1", 10), 1) - 1) * safeLimit;

  // Run count and data fetch in parallel to minimise round-trips
  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM customers ${where}`, params),
    pool.query(
      `SELECT
         cdp_id,
         CONCAT(first_name, ' ', COALESCE(last_name, '')) AS customer_name,
         customer_type,
         primary_source,
         status,
         TO_CHAR(updated_at, 'Mon DD, YYYY') AS last_updated
       FROM customers ${where}
       ORDER BY updated_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, safeLimit, offset]
    ),
  ]);

  return { customers: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), page, limit: safeLimit };
}

// Returns dashboard KPI stats with period-over-period growth percentages.
// Applies the same role-scoping as getCustomers so restricted viewers only
// see metrics for their own customer_type.
async function getStats({ viewerRole, viewerCustomerType } = {}) {
  const isRestricted = viewerRole !== "admin" && RESTRICTED_CUSTOMER_TYPES.has(viewerCustomerType);
  const scopeWhere   = isRestricted ? `WHERE customer_type ILIKE $1` : "";
  const scopeParams  = isRestricted ? [viewerCustomerType] : [];

  const res = await pool.query(`
    WITH current_stats AS (
      SELECT
        COUNT(*) AS total_customers,

        COUNT(*) FILTER (
          WHERE status = 'Active'
            AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', CURRENT_DATE)
        ) AS active_this_month,

        COUNT(*) FILTER (
          WHERE DATE_TRUNC('week', created_at) = DATE_TRUNC('week', CURRENT_DATE)
        ) AS new_this_week,

        COALESCE(
          ROUND(AVG(CASE WHEN lifetime_value > 0 THEN lifetime_value END)::numeric, 2),
          0
        ) AS avg_lifetime_value
      FROM customers ${scopeWhere}
    ),

    -- Baseline period (30-day lag) used to compute growth deltas.
    -- GREATEST(..., 1) prevents division-by-zero in the final SELECT.
    previous_stats AS (
      SELECT
        GREATEST(
          COUNT(*) FILTER (
            WHERE created_at < NOW() - INTERVAL '30 days'
          ), 1
        ) AS prev_total,

        GREATEST(
          COUNT(*) FILTER (
            WHERE status = 'Active'
              AND updated_at >= NOW() - INTERVAL '60 days'
              AND updated_at < NOW() - INTERVAL '30 days'
          ),
          1
        ) AS prev_active_month,

        GREATEST(
          COUNT(*) FILTER (
            WHERE created_at >= NOW() - INTERVAL '14 days'
              AND created_at < NOW() - INTERVAL '7 days'
          ),
          1
        ) AS prev_new_week,

        GREATEST(
          COALESCE(
            ROUND(
              AVG(CASE WHEN created_at < NOW() - INTERVAL '30 days' THEN NULLIF(lifetime_value, 0) END)::numeric,
              2
            ), 1
          ), 1
        ) AS prev_avg_lifetime_value
      FROM customers ${scopeWhere}
    )

    SELECT
      c.total_customers,
      ROUND(((c.total_customers - p.prev_total)::numeric / NULLIF(p.prev_total, 0)) * 100, 1) AS total_growth,
      c.active_this_month,
      c.new_this_week,
      c.avg_lifetime_value,
      ROUND((c.active_this_month::numeric / NULLIF(c.total_customers, 0)) * 100, 1) AS active_growth,
      ROUND((c.new_this_week::numeric      / NULLIF(c.total_customers, 0)) * 100, 1) AS new_growth,
      CASE
        WHEN p.prev_avg_lifetime_value = 0 THEN 0
        ELSE ROUND(
          ((c.avg_lifetime_value - p.prev_avg_lifetime_value)::numeric
          / NULLIF(p.prev_avg_lifetime_value, 0)) * 100, 1
        )
      END AS avg_lifetime_growth
    FROM current_stats c
    CROSS JOIN previous_stats p
  `, scopeParams);

  return res.rows[0];
}

module.exports = { getCustomers, getStats };
