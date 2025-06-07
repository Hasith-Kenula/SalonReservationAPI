const express = require("express");
const router = express.Router();

const salonOpeningController = require("../controllers/salolnOpening");

router.get("/:salonID", salonOpeningController.getSalonOpening); //get Opening hours of a salon
router.put("/:salonID", salonOpeningController.updateSalonOpening); //update Opening hours of a salon

module.exports = router;
