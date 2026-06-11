const express     = require("express");
const router      = express.Router();
const requireAuth = require("../middlewares/requireAuth");
const ctrl        = require("../controllers/dealerController");
const upload      = require("../middlewares/upload");

router.use(requireAuth);

router.get("/stats",            ctrl.stats);router.get("/template", ctrl.template);
router.post("/bulk-upload", upload.single("file"), ctrl.bulkUpload);
router.get("/",                 ctrl.hierarchy);
router.get("/:code",            ctrl.detail);
router.post("/:code/access",    ctrl.requestAccess);

module.exports = router;
