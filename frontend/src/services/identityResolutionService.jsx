import apiFetch from "./apiFetch";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/identity-resolution`;

// GET /api/identity-resolution/dashboard — returns identity KPIs such as
// total profiles, match rate, and unresolved conflicts
export const getIdentityDashboard = async () => {
  const res = await apiFetch(`${BASE_URL}/dashboard`);
  if (!res.ok) throw new Error("Failed to load identity dashboard");
  const json = await res.json();
  return json.data;
};

// GET /api/identity-resolution/matches — paginated list of cross-channel
// identity matches; supports full-text search by customer identifiers
export const getIdentityMatches = async ({ search, page, limit }) => {
  const params = new URLSearchParams({ search: search || "", page, limit });
  const res = await apiFetch(`${BASE_URL}/matches?${params}`);
  if (!res.ok) throw new Error("Failed to load identity matches");
  const json = await res.json();
  return json.data;
};

// GET /api/identity-resolution/rules — fetches all matching rules (e.g. email,
// phone, cookie) used by the resolution engine
export const getIdentityRules = async () => {
  const res = await apiFetch(`${BASE_URL}/rules`);
  if (!res.ok) throw new Error("Failed to load identity rules");
  const json = await res.json();
  return json.data;
};

// PATCH /api/identity-resolution/rules/:id — toggles a rule's enabled state
// without requiring a full update payload
export const toggleIdentityRule = async (id) => {
  const res = await apiFetch(`${BASE_URL}/rules/${id}`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to toggle identity rule");
  const json = await res.json();
  return json.data;
};

// POST /api/identity-resolution/merge — submits a manual merge request to
// combine two or more customer profiles into a single canonical record
export const mergeProfiles = async (payload) => {
  const res = await apiFetch(`${BASE_URL}/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to merge profiles");
  const json = await res.json();
  return json.data;
};
