const express     = require("express");
const router      = express.Router();
const requireAuth = require("../middlewares/requireAuth");
const ctrl        = require("../controllers/auditController");

router.use(requireAuth);

router.get("/", ctrl.listLogs);

module.exports = router;
