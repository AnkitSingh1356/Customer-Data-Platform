const express = require("express");

const router = express.Router();

const controller = require("../controllers/promotionalEffectivenessController");

router.get("/overview", controller.getOverview);

router.get("/campaigns", controller.getCampaigns);

router.get("/budget-performance", controller.getBudgetPerformance);

router.get("/status-distribution", controller.getStatusDistribution);

router.get("/export", controller.exportCampaigns);

module.exports = router;
