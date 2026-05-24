const express = require("express");
const router  = express.Router();
const segController = require("../controllers/segmentController");

router.get("/stats",  segController.stats);
router.get("/",       segController.list);
router.get("/:id",    segController.getOne);
router.post("/",      segController.create);
router.put("/:id",    segController.update);
router.delete("/:id", segController.remove);

module.exports = router; 


















