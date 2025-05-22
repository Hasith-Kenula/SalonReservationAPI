const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservation");

router.get("/", reservationController.getAll);
router.post("/", reservationController.reserve); // make a new reservation
router.get("/:id", reservationController.getSpecific);

module.exports = router;
