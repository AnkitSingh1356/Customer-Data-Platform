import apiFetch from "./apiFetch";
const BASE_URL =
  `${import.meta.env.VITE_API_BASE_URL}/api/consent-compliance`;

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

  return json.data;
}

export async function fetchConsentDashboard() {
  return request("/dashboard");
}

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

export async function createConsentRecord(payload) {
  return request("/records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateConsentRecord(id, payload) {
  return request(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function exportAuditLogs() {
  return request("/audit-logs");
}

export async function exportConsentRecords() {
  return request("/export-records");
}
