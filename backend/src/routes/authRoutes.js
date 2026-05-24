const express     = require("express");
const router      = express.Router();
const ctrl        = require("../controllers/authController");
const requireAuth = require("../middlewares/requireAuth");

router.post("/register", ctrl.register);
router.post("/login",    ctrl.login);

router.get ("/me",       requireAuth, ctrl.me);
router.put ("/profile",  requireAuth, ctrl.updateProfile);
router.put ("/password", requireAuth, ctrl.changePassword);

module.exports = router;
