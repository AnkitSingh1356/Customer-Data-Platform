//backend\src\routes\behavioralAnalyticsRoutes.js
const express = require("express");

const router = express.Router();

const controller = require("../controllers/behavioralAnalyticsController");

router.get("/overview", controller.getOverview);

router.get("/engagement", controller.getEngagement);

router.get("/top-pages", controller.getTopPages);

router.get("/traffic-sources", controller.getTrafficSources);

router.get("/activities", controller.getActivities);

router.get("/export", controller.exportAnalytics);

module.exports = router;
