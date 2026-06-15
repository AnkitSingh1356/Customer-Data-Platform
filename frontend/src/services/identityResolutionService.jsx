import apiFetch from "./apiFetch";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/identity-resolution`;

export const getIdentityDashboard = async () => {
  const res = await apiFetch(`${BASE_URL}/dashboard`);
  if (!res.ok) throw new Error("Failed to load identity dashboard");
  const json = await res.json();
  return json.data;
};

export const getIdentityMatches = async ({ search, page, limit }) => {
  const params = new URLSearchParams({ search: search || "", page, limit });
  const res = await apiFetch(`${BASE_URL}/matches?${params}`);
  if (!res.ok) throw new Error("Failed to load identity matches");
  const json = await res.json();
  return json.data;
};

export const getIdentityRules = async () => {
  const res = await apiFetch(`${BASE_URL}/rules`);
  if (!res.ok) throw new Error("Failed to load identity rules");
  const json = await res.json();
  return json.data;
};

export const toggleIdentityRule = async (id) => {
  const res = await apiFetch(`${BASE_URL}/rules/${id}`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to toggle identity rule");
  const json = await res.json();
  return json.data;
};

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
