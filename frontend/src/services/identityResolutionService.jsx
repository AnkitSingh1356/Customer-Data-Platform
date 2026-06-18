import apiFetch from "./apiFetch";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/identity-resolution`;

/**
 * Fetches identity resolution KPIs from the dashboard endpoint.
 * Usage: Call on page load to populate the identity resolution overview cards.
 * @returns {Promise<Object>} KPI object including totalProfiles, matchRate, and unresolvedConflicts
 */
export const getIdentityDashboard = async () => {
  const res = await apiFetch(`${BASE_URL}/dashboard`);
  if (!res.ok) throw new Error("Failed to load identity dashboard");
  const json = await res.json();
  return json.data;
};

/**
 * Fetches a paginated list of cross-channel identity matches with optional full-text search.
 * Usage: Call when loading the merge queue table or when search/page controls change.
 * @param {Object} params - Query parameters
 * @param {string} [params.search] - Full-text search string for customer identifiers
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.limit - Number of records per page
 * @returns {Promise<{matches: Object[], total: number}>} Paginated match records and total count
 */
export const getIdentityMatches = async ({ search, page, limit }) => {
  const params = new URLSearchParams({ search: search || "", page, limit });
  const res = await apiFetch(`${BASE_URL}/matches?${params}`);
  if (!res.ok) throw new Error("Failed to load identity matches");
  const json = await res.json();
  return json.data;
};

/**
 * Fetches all identity matching rules used by the resolution engine.
 * Usage: Call on page load to populate the MatchRulesCard; re-call after toggling a rule.
 * @returns {Promise<Object[]>} Array of rule objects with id, rule_name, confidence_score, and is_active
 */
export const getIdentityRules = async () => {
  const res = await apiFetch(`${BASE_URL}/rules`);
  if (!res.ok) throw new Error("Failed to load identity rules");
  const json = await res.json();
  return json.data;
};

/**
 * Toggles the enabled/disabled state of an identity matching rule.
 * Usage: Call when the user clicks the toggle switch on a rule in MatchRulesCard.
 * @param {string|number} id - The rule ID to toggle
 * @returns {Promise<Object>} The updated rule object reflecting the new is_active state
 */
export const toggleIdentityRule = async (id) => {
  const res = await apiFetch(`${BASE_URL}/rules/${id}`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to toggle identity rule");
  const json = await res.json();
  return json.data;
};

/**
 * Submits a manual merge request to combine customer profiles into a single canonical record.
 * Usage: Call when the user confirms a merge action in the MergeQueueTable.
 * @param {Object} payload - Merge request body containing the profile IDs to merge
 * @returns {Promise<Object>} The resulting merged profile record
 */
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
