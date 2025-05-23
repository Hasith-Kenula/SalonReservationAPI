const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service");

router.get("/", serviceController.getAll);
router.post("/create", serviceController.create);
router.put("/:serviceID", serviceController.update);

module.exports = router;
