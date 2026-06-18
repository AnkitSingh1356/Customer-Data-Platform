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

/**
 * Fetches top-level campaign KPI summary cards from the promotional effectiveness API.
 * Usage: Call on page load to populate the overview KPI row (spend, revenue, ROAS, conversion rate).
 * @returns {Promise<Object>} KPI summary with totalSpend, revenue, roas, and conversionRate fields
 */
export const fetchOverview =
  async () => {
    const response = await cdpAxios.get(`${API}/overview`);
    return response.data.data;
  };

/**
 * Fetches a paginated and filtered campaign list.
 * Usage: Call when loading the campaigns table or when filter/page controls change.
 * @param {Object} params - Query parameters such as page, limit, status, and date range
 * @returns {Promise<{campaigns: Object[], total: number}>} Paginated campaign records and total count
 */
export const fetchCampaigns =
  async (params) => {
    const response = await cdpAxios.get(`${API}/campaigns`, { params });
    return response.data.data;
  };

/**
 * Fetches planned vs. actual spend per campaign for the budget utilisation chart.
 * Usage: Call on page load or on refresh to render the budget performance bar chart.
 * @returns {Promise<Object[]>} Array of campaign budget objects with planned and actual spend values
 */
export const fetchBudgetPerformance =
  async () => {
    const response = await cdpAxios.get(`${API}/budget-performance`);
    return response.data.data;
  };

/**
 * Fetches campaign counts grouped by status for the status distribution pie chart.
 * Usage: Call on page load to populate the status distribution chart (active, paused, completed, draft).
 * @returns {Promise<Object[]>} Array of status-count objects, e.g. [{ status: "active", count: 12 }]
 */
export const fetchStatusDistribution =
  async () => {
    const response = await cdpAxios.get(`${API}/status-distribution`);
    return response.data.data;
  };

/**
 * Fetches the full campaigns dataset as JSON for client-side CSV download.
 * Usage: Call when the user clicks the Export button; pass the result to exportCsvFile.
 * @returns {Promise<Object[]>} Flat array of all campaign records ready for CSV serialization
 */
export const exportCampaigns =
  async () => {
    const response = await cdpAxios.get(`${API}/export`);
    return response.data.data;
  };
