//frontend\src\services\behavioralAnalyticsService.jsx
const BASE =
  `${import.meta.env.VITE_API_BASE_URL}/api/behavioral-analytics`

export async function fetchOverview(range = "30d") {
  const res = await fetch(
    `${BASE}/overview?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch overview");
  }

  return res.json();
}

export async function fetchEngagement(range = "30d") {
  const res = await fetch(
    `${BASE}/engagement?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch engagement");
  }

  return res.json();
}

export async function fetchTopPages(range = "30d") {
  const res = await fetch(
    `${BASE}/top-pages?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch top pages");
  }

  return res.json();
}

export async function fetchTrafficSources(range = "30d") {
  const res = await fetch(
    `${BASE}/traffic-sources?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch traffic sources");
  }

  return res.json();
}

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

  const res = await fetch(
    `${BASE}/activities?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch activities");
  }

  return res.json();
}

export async function exportAnalytics(range = "30d") {
  const res = await fetch(
    `${BASE}/export?range=${range}`
  );

  if (!res.ok) {
    throw new Error("Failed to export analytics");
  }

  return res.json();
}
