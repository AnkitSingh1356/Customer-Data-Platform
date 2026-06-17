import apiFetch from "./apiFetch";
const BASE =
  `${import.meta.env.VITE_API_BASE_URL}/api/behavioral-analytics`

// GET /api/behavioral-analytics/overview — returns KPI summary cards for the
// given time range (e.g. total sessions, bounce rate, avg. session duration)
export async function fetchOverview(range = "30d") {
  const res = await apiFetch(
    `${BASE}/overview?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch overview");
  }

  return res.json();
}

// GET /api/behavioral-analytics/engagement — returns time-series engagement
// metrics (page views, clicks, scroll depth) for chart rendering
export async function fetchEngagement(range = "30d") {
  const res = await apiFetch(
    `${BASE}/engagement?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch engagement");
  }

  return res.json();
}

// GET /api/behavioral-analytics/top-pages — returns ranked list of most-visited
// pages with view counts for the selected range
export async function fetchTopPages(range = "30d") {
  const res = await apiFetch(
    `${BASE}/top-pages?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch top pages");
  }

  return res.json();
}

// GET /api/behavioral-analytics/traffic-sources — returns breakdown of referral
// channels (organic, direct, social, etc.) as counts and percentages
export async function fetchTrafficSources(range = "30d") {
  const res = await apiFetch(
    `${BASE}/traffic-sources?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch traffic sources");
  }

  return res.json();
}

// GET /api/behavioral-analytics/activities — paginated event log with optional
// full-text search; returns rows and total count for the activity table
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

// GET /api/behavioral-analytics/export — returns the full analytics dataset as
// JSON ready to be passed to exportCsvFile for client-side CSV download
export async function exportAnalytics(range = "30d") {
  const res = await apiFetch(
    `${BASE}/export?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to export analytics");
  }

  return res.json();
}
