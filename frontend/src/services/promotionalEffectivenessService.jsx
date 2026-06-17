import axios from "axios";
const API = `${import.meta.env.VITE_API_BASE_URL}/api/promotional-effectiveness`;
// Dedicated axios instance so the interceptor does not affect other axios usage
const cdpAxios = axios.create();
// Intercept every request to attach the CDP JWT — mirrors apiFetch behaviour
// but uses axios instead of fetch for this service
cdpAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("cdp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// GET /api/promotional-effectiveness/overview — returns top-level campaign KPIs
// (total spend, revenue, ROAS, conversion rate) as summary cards
export const fetchOverview =
  async () => {
    const response = await cdpAxios.get(`${API}/overview`);
    return response.data.data;
  };

// GET /api/promotional-effectiveness/campaigns — paginated/filtered campaign
// list; accepts params such as page, limit, status, and date range
export const fetchCampaigns =
  async (params) => {
    const response = await cdpAxios.get(`${API}/campaigns`, { params });
    return response.data.data;
  };

// GET /api/promotional-effectiveness/budget-performance — returns planned vs
// actual spend per campaign for the budget utilisation chart
export const fetchBudgetPerformance =
  async () => {
    const response = await cdpAxios.get(`${API}/budget-performance`);
    return response.data.data;
  };

// GET /api/promotional-effectiveness/status-distribution — returns campaign
// counts grouped by status (active, paused, completed, draft) for the pie chart
export const fetchStatusDistribution =
  async () => {
    const response = await cdpAxios.get(`${API}/status-distribution`);
    return response.data.data;
  };

// GET /api/promotional-effectiveness/export — returns the full campaigns
// dataset as JSON for client-side CSV download
export const exportCampaigns =
  async () => {
    const response = await cdpAxios.get(`${API}/export`);
    return response.data.data;
  };
