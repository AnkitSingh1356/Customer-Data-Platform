const promotionalService = require("../services/promotionalEffectivenessService");

// Returns top-level campaign performance metrics (total spend, impressions, conversions)
const getOverview = async (_req, res) => {
  try {
    const data = await promotionalService.getOverview();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch overview",
    });
  }
};

// Returns campaigns filtered by name/status; status supports: all, active, paused, ended
const getCampaigns = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
    } = req.query;

    const data =
      await promotionalService.getCampaigns({
        search,
        status,
      });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns",
    });
  }
};

// Returns budget vs. actual spend breakdown across campaigns for ROI analysis
const getBudgetPerformance = async (_req, res) => {
  try {
    const data =
      await promotionalService.getBudgetPerformance();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch budget performance",
    });
  }
};

// Returns campaign count grouped by status for dashboard pie/bar chart display
const getStatusDistribution = async (_req, res) => {
  try {
    const data =
      await promotionalService.getStatusDistribution();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch status distribution",
    });
  }
};

// Exports all campaign records (no filters) for offline reporting or data transfer
const exportCampaigns = async (_req, res) => {
  try {
    const data =
      await promotionalService.exportCampaigns();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to export campaigns",
    });
  }
};

module.exports = {
  getOverview,
  getCampaigns,
  getBudgetPerformance,
  getStatusDistribution,
  exportCampaigns,
};
