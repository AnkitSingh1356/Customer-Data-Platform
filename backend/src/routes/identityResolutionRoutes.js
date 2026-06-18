const express     = require("express");
const router      = express.Router();
const requireAuth = require("../middlewares/requireAuth");
const controller  = require("../controllers/identityResolutionController");

router.use(requireAuth);

router.get("/dashboard",   controller.getDashboard);
router.get("/matches",     controller.getMatches);
router.get("/rules",       controller.getRules);
router.patch("/rules/:id", controller.toggleRule);
router.post("/merge",      controller.mergeProfiles);

module.exports = router;
