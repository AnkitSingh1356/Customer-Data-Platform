import axios from "axios";
const API = `${import.meta.env.VITE_API_BASE_URL}/api/promotional-effectiveness`;

export const fetchOverview =
  async () => {
    const response =
      await axios.get(
        `${API}/overview`
      );

    return response.data.data;
  };

export const fetchCampaigns =
  async (params) => {
    const response =
      await axios.get(
        `${API}/campaigns`,
        {
          params,
        },
      );

    return response.data.data;
  };

export const fetchBudgetPerformance =
  async () => {
    const response =
      await axios.get(
        `${API}/budget-performance`
      );

    return response.data.data;
  };

export const fetchStatusDistribution =
  async () => {
    const response =
      await axios.get(
        `${API}/status-distribution`
      );

    return response.data.data;
  };

export const exportCampaigns =
  async () => {
    const response =
      await axios.get(
        `${API}/export`
      );

    return response.data.data;
  };
