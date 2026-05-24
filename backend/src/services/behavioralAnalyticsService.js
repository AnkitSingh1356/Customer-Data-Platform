//backend\src\services\behavioralAnalyticsService.js
const pool = require("../config/db");

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
              WHERE session_duration < 30
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

async function getEngagement({ range = "30d" }) {
  const now = new Date();

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const daysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const engagement = [];

  for (let day = 1; day <= daysInMonth; day++) {
    engagement.push({
      label: `${day}`,
      sessions: Math.floor(Math.random() * 18) + 10,
    });
  }

  return engagement;
}
/* =========================================================
   TOP PAGES
========================================================= */

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

    LIMIT 5
    `,
    [days]
  );

  return result.rows;
}

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


async function getActivities({
  search = "",
  page = 1,
  limit = 10,
  range = "30d",
}) {
  const days = getDateFilter(range);

  const offset = (page - 1) * limit;

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


async function exportAnalytics({
  range = "30d",
}) {
  const days = getDateFilter(range);

  const result = await pool.query(
    `
    SELECT *
    FROM behavioral_events

    WHERE
      created_at >= NOW() - ($1 || ' days')::INTERVAL

    ORDER BY created_at DESC
    `,
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
