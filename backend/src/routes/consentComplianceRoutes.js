//backend\src\routes\consentComplianceRoutes.js
const express = require("express");

const router = express.Router();

const controller = require("../controllers/consentComplianceController");

router.get("/dashboard", controller.getDashboardOverview);

router.get("/records", controller.getConsentRecords);

router.post("/records", controller.createConsentRecord);

router.put("/records/:id", controller.updateConsentRecord);

router.get("/audit-logs", controller.exportAuditLogs);

router.get("/export-records", controller.exportConsentRecords);
module.exports = router;
