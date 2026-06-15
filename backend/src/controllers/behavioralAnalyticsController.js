//backend\src\controllers\behavioralAnalyticsController.js
const service = require("../services/behavioralAnalyticsService");

async function getOverview(req, res) {
  try {
    const data = await service.getOverview(req.query);

    return res.json(data);

  } catch (err) {
    console.error("[Behavioral Analytics Overview]", err);

    return res.status(500).json({
      error: "Failed to fetch overview analytics",
    });
  }
}

async function getEngagement(req, res) {
  try {
    const data = await service.getEngagement(req.query);

    return res.json(data);

  } catch (err) {
    console.error("[Behavioral Analytics Engagement]", err);

    return res.status(500).json({
      error: "Failed to fetch engagement analytics",
    });
  }
}

async function getTopPages(req, res) {
  try {
    const data = await service.getTopPages(req.query);

    return res.json(data);

  } catch (err) {
    console.error("[Behavioral Analytics Top Pages]", err);

    return res.status(500).json({
      error: "Failed to fetch top pages",
    });
  }
}

async function getTrafficSources(req, res) {
  try {
    const data = await service.getTrafficSources(req.query);

    return res.json(data);

  } catch (err) {
    console.error("[Behavioral Analytics Traffic Sources]", err);

    return res.status(500).json({
      error: "Failed to fetch traffic sources",
    });
  }
}

async function getActivities(req, res) {
  try {
    const data = await service.getActivities(req.query);

    return res.json(data);

  } catch (err) {
    console.error("[Behavioral Analytics Activities]", err);

    return res.status(500).json({
      error: "Failed to fetch activities",
    });
  }
}

async function exportAnalytics(req, res) {
  try {
    const data = await service.exportAnalytics(req.query);

    return res.json(data);

  } catch (err) {
    console.error("[Behavioral Analytics Export]", err);

    return res.status(500).json({
      error: "Failed to export analytics",
    });
  }
}

module.exports = {
  getOverview,
  getEngagement,
  getTopPages,
  getTrafficSources,
  getActivities,
  exportAnalytics,
};
