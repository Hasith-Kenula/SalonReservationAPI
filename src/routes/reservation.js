const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservation");

router.get("/", reservationController.getAll);
router.post("/", reservationController.reserve); // make a new reservation
router.get("/:resID", reservationController.getSpecific);
router.delete("/:resID", reservationController.delete); // delete a reservation

router.get(
  "/customer/:customerID",
  reservationController.getReservationsByCustomerID
);

module.exports = router;
