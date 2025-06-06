const express = require("express");
const router = express.Router();

const salonOpeningController = require("../controllers/salolnOpening");

router.get("/:salonID", salonOpeningController.getSalonOpening);

module.exports = router;
