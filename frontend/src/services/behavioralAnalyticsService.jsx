import apiFetch from "./apiFetch";
const BASE =
  `${import.meta.env.VITE_API_BASE_URL}/api/behavioral-analytics`

/**
 * Fetches KPI summary cards for the given time range from the behavioral analytics API.
 * Usage: Call on page load and whenever the range selector changes to refresh overview metrics.
 * @param {string} [range="30d"] - Time range filter (e.g. "7d", "30d", "90d")
 * @returns {Promise<Object>} KPI summary object with fields such as totalSessions, bounceRate, avgSessionDuration
 */
export async function fetchOverview(range = "30d") {
  const res = await apiFetch(
    `${BASE}/overview?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch overview");
  }

  return res.json();
}

/**
 * Fetches time-series engagement metrics for chart rendering.
 * Usage: Call when loading the engagement chart; re-call on range change.
 * @param {string} [range="30d"] - Time range filter (e.g. "7d", "30d", "90d")
 * @returns {Promise<Object[]>} Array of data points with pageViews, clicks, and scrollDepth per interval
 */
export async function fetchEngagement(range = "30d") {
  const res = await apiFetch(
    `${BASE}/engagement?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch engagement");
  }

  return res.json();
}

/**
 * Fetches a ranked list of the most-visited pages for the selected time range.
 * Usage: Call to populate the top-pages table; re-call on range change.
 * @param {string} [range="30d"] - Time range filter (e.g. "7d", "30d", "90d")
 * @returns {Promise<Object[]>} Array of page objects with path and viewCount fields
 */
export async function fetchTopPages(range = "30d") {
  const res = await apiFetch(
    `${BASE}/top-pages?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch top pages");
  }

  return res.json();
}

/**
 * Fetches the breakdown of referral channels (organic, direct, social, etc.) for the given range.
 * Usage: Call to populate the traffic sources chart; re-call on range change.
 * @param {string} [range="30d"] - Time range filter (e.g. "7d", "30d", "90d")
 * @returns {Promise<Object[]>} Array of channel objects with source, count, and percentage fields
 */
export async function fetchTrafficSources(range = "30d") {
  const res = await apiFetch(
    `${BASE}/traffic-sources?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch traffic sources");
  }

  return res.json();
}

/**
 * Fetches a paginated event log from the behavioral analytics API with optional full-text search.
 * Usage: Call when loading the activity table or when search/page/range controls change.
 * @param {Object} params - Query parameters
 * @param {string} [params.search=""] - Full-text search string
 * @param {number} [params.page=1] - Page number (1-based)
 * @param {number} [params.limit=10] - Number of rows per page
 * @param {string} [params.range="30d"] - Time range filter
 * @returns {Promise<{rows: Object[], total: number}>} Paginated activity rows and total record count
 */
export async function fetchActivities({
  search = "",
  page = 1,
  limit = 10,
  range = "30d",
}) {
  const params = new URLSearchParams({
    search,
    page,
    limit,
    range,
  });

  const res = await apiFetch(
    `${BASE}/activities?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch activities");
  }

  return res.json();
}

/**
 * Fetches the full behavioral analytics dataset for client-side CSV download.
 * Usage: Call when the user clicks the Export button; pass the result to exportCsvFile.
 * @param {string} [range="30d"] - Time range filter for the exported dataset
 * @returns {Promise<Object[]>} Flat array of analytics records ready for CSV serialization
 */
export async function exportAnalytics(range = "30d") {
  const res = await apiFetch(
    `${BASE}/export?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to export analytics");
  }

  return res.json();
}
