//cdp-bulk-upload\cdp-backend\src\routes\customerRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const {
  startBulkUpload,
  getUploadStatus,
  downloadTemplate,
} = require("../controllers/bulkUploadController");
const {
  listCustomers,
  getCustomerStats,
} = require("../controllers/customerController");
const {
  fetchProfile,
  createAttribute,
} = require("../controllers/profileController");

router.get("/", listCustomers);
router.get("/stats", getCustomerStats);

router.get("/template", downloadTemplate);

router.post(
  "/bulk-upload",
  upload.single("file"),
  (err, req, res, next) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  },
  startBulkUpload,
);
router.get("/bulk-upload/:jobId", getUploadStatus);

router.get("/:cdpId/profile", fetchProfile);
router.post("/:cdpId/attributes", createAttribute);

module.exports = router;
