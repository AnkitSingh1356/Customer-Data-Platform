import apiFetch from "./apiFetch";
const BASE_URL =
  `${import.meta.env.VITE_API_BASE_URL}/api/consent-compliance`;

/**
 * Sends an authenticated JSON request to the consent-compliance API and unwraps json.data.
 * Usage: Internal helper used by all exported functions in this service.
 * @param {string} [endpoint=""] - Path appended to BASE_URL (e.g. "/records")
 * @param {RequestInit} [options={}] - Standard fetch options (method, body, etc.)
 * @returns {Promise<any>} The unwrapped data payload from json.data
 */
async function request(endpoint = "", options = {}) {
  const response = await apiFetch(
    `${BASE_URL}${endpoint}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    }
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      json?.message || "Something went wrong"
    );
  }

  // All consent-compliance responses wrap their payload under a `data` key
  return json.data;
}

/**
 * Fetches aggregate consent KPIs from the dashboard endpoint.
 * Usage: Call on page load to populate the consent compliance dashboard overview cards.
 * @returns {Promise<Object>} KPI object including optInRate, pendingReviews, and complianceScore
 */
export async function fetchConsentDashboard() {
  return request("/dashboard");
}

/**
 * Fetches a paginated, filterable list of consent records.
 * Usage: Call when loading the records table or when any filter/page control changes.
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number (1-based)
 * @param {number} [params.limit=10] - Records per page
 * @param {string} [params.search=""] - Full-text search string
 * @param {string} [params.status="all"] - Status filter: "all" | "active" | "revoked" | "pending"
 * @returns {Promise<{records: Object[], total: number}>} Paginated records and total count
 */
export async function fetchConsentRecords({
  page = 1,
  limit = 10,
  search = "",
  status = "all",
}) {
  const params = new URLSearchParams({
    page,
    limit,
    search,
    status,
  });

  return request(`/records?${params.toString()}`);
}

/**
 * Creates a new consent record via the API.
 * Usage: Call when the user submits the consent record creation form.
 * @param {Object} payload - New record data matching the ConsentRecord model shape
 * @returns {Promise<Object>} The newly created consent record
 */
export async function createConsentRecord(payload) {
  return request("/records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Updates an existing consent record by ID.
 * Usage: Call when the user edits a record's status, expiry, or other fields.
 * @param {string|number} id - The consent record ID to update
 * @param {Object} payload - Updated fields (e.g. status, expiry date)
 * @returns {Promise<Object>} The updated consent record
 */
export async function updateConsentRecord(id, payload) {
  return request(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches the full consent audit trail for CSV export (no pagination).
 * Usage: Call when the user triggers the audit log export action.
 * @returns {Promise<Object[]>} Complete flat array of audit log entries
 */
export async function exportAuditLogs() {
  return request("/audit-logs");
}

/**
 * Fetches all consent records as a flat JSON array for client-side CSV generation.
 * Usage: Call when the user clicks the Export Records button; pass the result to exportCsvFile.
 * @returns {Promise<Object[]>} Flat array of all consent record objects
 */
export async function exportConsentRecords() {
  return request("/export-records");
}
