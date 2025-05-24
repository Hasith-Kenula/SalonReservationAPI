const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service");

router.get("/:salonID", serviceController.getSalonServices); // get all service for related salon
router.get("/", serviceController.getAllServices); // get all services
router.post("/create", serviceController.create);
router.put("/:serviceID", serviceController.update);
router.delete("/:serviceID", serviceController.delete); // delete service

module.exports = router;
