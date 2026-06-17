const service = require("../services/behavioralAnalyticsService");

/**
 * Returns high-level KPIs (sessions, users, bounce rate, etc.) filtered by the supplied date range.
 * Usage: Called by Express router on GET /analytics/overview
 * @param {import('express').Request} req - req.query contains date range filters (e.g. startDate, endDate)
 * @param {import('express').Response} res - Sends JSON response
 * @returns {Promise<void>} JSON object with aggregated overview KPI metrics, or 500 error JSON on failure
 */
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

/**
 * Returns per-session interaction metrics (avg. time on page, scroll depth, clicks) for the requested period.
 * Usage: Called by Express router on GET /analytics/engagement
 * @param {import('express').Request} req - req.query contains date range filters (e.g. startDate, endDate)
 * @param {import('express').Response} res - Sends JSON response
 * @returns {Promise<void>} JSON object with engagement metric data, or 500 error JSON on failure
 */
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

/**
 * Returns pages ranked by view count and visit frequency to identify high-traffic content.
 * Usage: Called by Express router on GET /analytics/top-pages
 * @param {import('express').Request} req - req.query contains date range filters (e.g. startDate, endDate)
 * @param {import('express').Response} res - Sends JSON response
 * @returns {Promise<void>} JSON array of pages with their view/visit metrics, or 500 error JSON on failure
 */
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

/**
 * Breaks down visitor origins (direct, referral, organic, paid) to support attribution reporting.
 * Usage: Called by Express router on GET /analytics/traffic-sources
 * @param {import('express').Request} req - req.query contains date range filters (e.g. startDate, endDate)
 * @param {import('express').Response} res - Sends JSON response
 * @returns {Promise<void>} JSON object with traffic source breakdown, or 500 error JSON on failure
 */
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

/**
 * Returns a time-ordered list of tracked user events (clicks, form submissions, etc.) with optional filters.
 * Usage: Called by Express router on GET /analytics/activities
 * @param {import('express').Request} req - req.query contains optional filters (e.g. startDate, endDate, eventType)
 * @param {import('express').Response} res - Sends JSON response
 * @returns {Promise<void>} JSON array of user activity events, or 500 error JSON on failure
 */
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

/**
 * Serialises the full analytics dataset for the requested filters, intended for CSV/Excel download workflows.
 * Usage: Called by Express router on GET /analytics/export
 * @param {import('express').Request} req - req.query contains export filters (e.g. startDate, endDate, type)
 * @param {import('express').Response} res - Sends JSON response
 * @returns {Promise<void>} JSON object with the full exportable analytics dataset, or 500 error JSON on failure
 */
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
