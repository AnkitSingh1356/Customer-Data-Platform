import apiFetch from "./apiFetch";
const BASE_URL =
  `${import.meta.env.VITE_API_BASE_URL}/api/consent-compliance`;

// Internal helper — sends an authenticated JSON request and unwraps json.data,
// throwing a descriptive error when the response is not ok
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

// GET /api/consent-compliance/dashboard — returns aggregate consent KPIs
// (opt-in rate, pending reviews, compliance score, etc.)
export async function fetchConsentDashboard() {
  return request("/dashboard");
}

// GET /api/consent-compliance/records — paginated, filterable consent record
// list; status can be "all", "active", "revoked", or "pending"
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

// POST /api/consent-compliance/records — creates a new consent record;
// payload shape mirrors the ConsentRecord model
export async function createConsentRecord(payload) {
  return request("/records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PUT /api/consent-compliance/records/:id — updates an existing consent record
// (e.g. to change status or extend expiry)
export async function updateConsentRecord(id, payload) {
  return request(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// GET /api/consent-compliance/audit-logs — returns the full audit trail for
// CSV download; no pagination (full dataset intended for export)
export async function exportAuditLogs() {
  return request("/audit-logs");
}

// GET /api/consent-compliance/export-records — returns all consent records
// as a flat JSON array for client-side CSV generation
export async function exportConsentRecords() {
  return request("/export-records");
}
