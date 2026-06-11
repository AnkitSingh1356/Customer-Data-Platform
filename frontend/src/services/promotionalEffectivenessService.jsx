import axios from "axios";
const API = `${import.meta.env.VITE_API_BASE_URL}/api/promotional-effectiveness`;
const cdpAxios = axios.create();
cdpAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("cdp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchOverview =
  async () => {
    const response = await cdpAxios.get(`${API}/overview`);
    return response.data.data;
  };

export const fetchCampaigns =
  async (params) => {
    const response = await cdpAxios.get(`${API}/campaigns`, { params });
    return response.data.data;
  };

export const fetchBudgetPerformance =
  async () => {
    const response = await cdpAxios.get(`${API}/budget-performance`);
    return response.data.data;
  };

export const fetchStatusDistribution =
  async () => {
    const response = await cdpAxios.get(`${API}/status-distribution`);
    return response.data.data;
  };

export const exportCampaigns =
  async () => {
    const response = await cdpAxios.get(`${API}/export`);
    return response.data.data;
  };
