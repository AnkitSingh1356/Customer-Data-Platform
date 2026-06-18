const pool = require("../config/db");
const { BOUNCE_THRESHOLD_SECONDS, TOP_PAGES_LIMIT, ACTIVITY_DEFAULT_LIMIT, ACTIVITY_MAX_LIMIT, ANALYTICS_EXPORT_LIMIT } = require("../config/constants");

/**
 * Converts a range string (e.g. "7d") to an integer number of days for use in SQL intervals.
 * Usage: Called internally by all behavioral analytics query functions
 * @param {string} [range="30d"] - One of "7d", "30d", or "90d"
 * @returns {number} Number of days corresponding to the range (defaults to 30)
 */
function getDateFilter(range = "30d") {
  switch (range) {
    case "7d":
      return 7;

    case "90d":
      return 90;

    default:
      return 30;
  }
}

/**
 * Returns aggregated KPIs for the overview panel: total sessions, average session duration,
 * bounce rate, and conversion rate for the requested time window.
 * Usage: Called by behavioralAnalyticsController.getOverview
 * @param {Object} opts - Query options
 * @param {string} [opts.range="30d"] - Time window ("7d", "30d", or "90d")
 * @returns {Promise<{ total_sessions: string, avg_session_duration: string, bounce_rate: string, conversion_rate: string }>}
 */
async function getOverview({ range = "30d" }) {
  const days = getDateFilter(range);

  const result = await pool.query(
    `
    SELECT
      COUNT(DISTINCT session_id) AS total_sessions,

      COALESCE(
        ROUND(AVG(session_duration)),
        0
      ) AS avg_session_duration,

      COALESCE(
        ROUND(
          (
            COUNT(*) FILTER (
              -- Sessions under 30 s are treated as bounces
              WHERE session_duration < ${BOUNCE_THRESHOLD_SECONDS}
            )::numeric
            / NULLIF(COUNT(*), 0)
          ) * 100,
          2
        ),
        0
      ) AS bounce_rate,

      COALESCE(
        ROUND(
          (
            COUNT(*) FILTER (
              WHERE converted = true
            )::numeric
            / NULLIF(COUNT(*), 0)
          ) * 100,
          2
        ),
        0
      ) AS conversion_rate

    FROM behavioral_events

    WHERE
      created_at >= NOW() - ($1 || ' days')::INTERVAL
    `,
    [days],
  );

  return result.rows[0];
}

/**
 * Returns daily unique-session counts for charting engagement trends over the requested period.
 * Usage: Called by behavioralAnalyticsController.getEngagement
 * @param {Object} opts - Query options
 * @param {string} [opts.range="30d"] - Time window ("7d", "30d", or "90d")
 * @returns {Promise<Array<{ label: string, sessions: number }>>} Daily session counts ordered by date
 */
async function getEngagement({ range = "30d" }) {
  const days = getDateFilter(range);

  const result = await pool.query(
    `SELECT
       DATE_TRUNC('day', created_at)::date AS label,
       COUNT(DISTINCT session_id)::int      AS sessions
     FROM behavioral_events
     WHERE created_at >= NOW() - ($1 * INTERVAL '1 day')
     GROUP BY 1
     ORDER BY 1`,
    [days]
  );

  return result.rows;
}
/* =========================================================
   TOP PAGES
========================================================= */

/**
 * Returns the most-viewed page URLs within the requested period, limited to TOP_PAGES_LIMIT results.
 * Usage: Called by behavioralAnalyticsController.getTopPages
 * @param {Object} opts - Query options
 * @param {string} [opts.range="30d"] - Time window ("7d", "30d", or "90d")
 * @returns {Promise<Array<{ page: string, views: string }>>} Top pages ordered by view count descending
 */
async function getTopPages({ range = "30d" }) {
  const days = getDateFilter(range);

  const result = await pool.query(
    `
    SELECT
      page_url AS page,

      COUNT(*) AS views

    FROM behavioral_events

    WHERE
      created_at >= NOW() - ($1 || ' days')::INTERVAL
      AND page_url IS NOT NULL

    GROUP BY page_url

    ORDER BY views DESC

    LIMIT ${TOP_PAGES_LIMIT}
    `,
    [days]
  );

  return result.rows;
}

/**
 * Aggregates event counts by traffic_source for the pie/bar chart breakdown.
 * Usage: Called by behavioralAnalyticsController.getTrafficSources
 * @param {Object} opts - Query options
 * @param {string} [opts.range="30d"] - Time window ("7d", "30d", or "90d")
 * @returns {Promise<Array<{ name: string, value: string }>>} Traffic sources ordered by event count descending
 */
async function getTrafficSources({ range = "30d" }) {
  const days = getDateFilter(range);

  const result = await pool.query(
    `
    SELECT
      traffic_source AS name,

      COUNT(*) AS value

    FROM behavioral_events

    WHERE
      created_at >= NOW() - ($1 || ' days')::INTERVAL
      AND traffic_source IS NOT NULL

    GROUP BY traffic_source

    ORDER BY value DESC
    `,
    [days]
  );

  return result.rows;
}


/**
 * Returns a paginated activity feed with computed avatar initials for display.
 * Usage: Called by behavioralAnalyticsController.getActivities
 * @param {Object} opts - Query and pagination options
 * @param {string} [opts.search=""] - Full-text search across user_name, event_type, city, country
 * @param {number} [opts.page=1] - Page number (1-based)
 * @param {number} [opts.limit=ACTIVITY_DEFAULT_LIMIT] - Records per page (capped at ACTIVITY_MAX_LIMIT)
 * @param {string} [opts.range="30d"] - Time window ("7d", "30d", or "90d")
 * @returns {Promise<{ rows: Array<Object>, total: number, page: number, limit: number, totalPages: number }>}
 */
async function getActivities({
  search = "",
  page = 1,
  limit = ACTIVITY_DEFAULT_LIMIT,
  range = "30d",
}) {
  const days = getDateFilter(range);
  // Cap page size at 500 to prevent accidental memory-heavy responses
  const safeLimit  = Math.min(Math.max(Number(limit) || ACTIVITY_DEFAULT_LIMIT, 1), ACTIVITY_MAX_LIMIT);
  const safePage   = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  limit = safeLimit;
  page  = safePage;

  const rowsQuery = `
    SELECT
      id,

      COALESCE(user_name, 'Anonymous') AS user,

      UPPER(
        LEFT(COALESCE(user_name, 'A'), 1) ||
        LEFT(
          SPLIT_PART(
            COALESCE(user_name, 'A B'),
            ' ',
            2
          ),
          1
        )
      ) AS initials,

      event_type AS activity,

      device_type AS device,

      CONCAT(city, ', ', country) AS location,

      created_at AS timestamp

    FROM behavioral_events

    WHERE
      created_at >= NOW() - ($1 || ' days')::INTERVAL

      AND (
        user_name ILIKE $2
        OR event_type ILIKE $2
        OR city ILIKE $2
        OR country ILIKE $2
      )

    ORDER BY created_at DESC

    LIMIT $3 OFFSET $4
  `;

  const countQuery = `
    SELECT COUNT(*) AS total

    FROM behavioral_events

    WHERE
      created_at >= NOW() - ($1 || ' days')::INTERVAL

      AND (
        user_name ILIKE $2
        OR event_type ILIKE $2
        OR city ILIKE $2
        OR country ILIKE $2
      )
  `;

  // Run data and count queries concurrently to reduce round-trip latency
  const [rows, count] = await Promise.all([
    pool.query(rowsQuery, [
      days,
      `%${search}%`,
      limit,
      offset,
    ]),

    pool.query(countQuery, [
      days,
      `%${search}%`,
    ]),
  ]);

  return {
    rows: rows.rows,

    total: Number(count.rows[0].total),

    page: Number(page),

    limit: Number(limit),

    totalPages: Math.ceil(
      Number(count.rows[0].total) /
      Number(limit)
    ),
  };
}


/**
 * Fetches raw event rows for CSV export, capped at ANALYTICS_EXPORT_LIMIT rows to limit memory use.
 * Usage: Called by behavioralAnalyticsController.exportAnalytics
 * @param {Object} opts - Export options
 * @param {string} [opts.range="30d"] - Time window ("7d", "30d", or "90d")
 * @returns {Promise<Array<Object>>} Event rows with all exportable columns
 */
async function exportAnalytics({
  range = "30d",
}) {
  const days = getDateFilter(range);

  const result = await pool.query(
    `SELECT id, session_id, user_name, event_type, page_url, device_type,
            city, country, traffic_source, converted, session_duration, created_at
     FROM behavioral_events
     WHERE created_at >= NOW() - ($1 * INTERVAL '1 day')
     ORDER BY created_at DESC
     LIMIT ${ANALYTICS_EXPORT_LIMIT}`,
    [days]
  );

  return result.rows;
}

module.exports = {
  getOverview,
  getEngagement,
  getTopPages,
  getTrafficSources,
  getActivities,
  exportAnalytics,
};
