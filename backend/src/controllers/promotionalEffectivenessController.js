const promotionalService = require("../services/promotionalEffectivenessService");

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
