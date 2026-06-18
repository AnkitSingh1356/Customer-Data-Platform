const promotionalService = require("../services/promotionalEffectivenessService");

/**
 * Returns top-level campaign performance metrics (total spend, impressions, conversions).
 * Usage: Called by Express router on GET /api/promotions/overview
 * @param {import('express').Request} _req - No parameters used
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: { success: true, data } on success; { success: false, message } on failure
 */
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

/**
 * Returns campaigns filtered by name/status.
 * Usage: Called by Express router on GET /api/promotions/campaigns
 * @param {import('express').Request} req - req.query: { search, status (all|active|paused|ended) }
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: { success: true, data } on success; { success: false, message } on failure
 */
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

/**
 * Returns budget vs. actual spend breakdown across campaigns for ROI analysis.
 * Usage: Called by Express router on GET /api/promotions/budget-performance
 * @param {import('express').Request} _req - No parameters used
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: { success: true, data } on success; { success: false, message } on failure
 */
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

/**
 * Returns campaign count grouped by status for dashboard pie/bar chart display.
 * Usage: Called by Express router on GET /api/promotions/status-distribution
 * @param {import('express').Request} _req - No parameters used
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: { success: true, data } on success; { success: false, message } on failure
 */
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

/**
 * Exports all campaign records (no filters) for offline reporting or data transfer.
 * Usage: Called by Express router on GET /api/promotions/export
 * @param {import('express').Request} _req - No parameters used
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: { success: true, data } on success; { success: false, message } on failure
 */
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
