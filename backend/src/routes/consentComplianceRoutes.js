const express     = require("express");
const router      = express.Router();
const requireAuth = require("../middlewares/requireAuth");
const controller  = require("../controllers/consentComplianceController");

router.use(requireAuth);

router.get("/dashboard", controller.getDashboardOverview);

router.get("/records", controller.getConsentRecords);

router.post("/records", controller.createConsentRecord);

router.put("/records/:id", controller.updateConsentRecord);

router.get("/audit-logs", controller.exportAuditLogs);

router.get("/export-records", controller.exportConsentRecords);
module.exports = router;
