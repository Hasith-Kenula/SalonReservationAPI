const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationService");

router.post("/", reservationServiceController.ADD);

module.exports = router;
