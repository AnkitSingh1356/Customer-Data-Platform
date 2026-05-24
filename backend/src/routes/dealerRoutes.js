//cdp-backend\src\routes\dealerRoutes.js
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/dealerController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.get("/stats",            ctrl.stats);router.get("/template", ctrl.template);
router.post("/bulk-upload", upload.single("file"), ctrl.bulkUpload);
router.get("/",                 ctrl.hierarchy);
router.get("/:code",            ctrl.detail);
router.post("/:code/access",    ctrl.requestAccess);

module.exports = router;
