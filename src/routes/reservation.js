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
); // get all reservations for a customer

router.get("/salon/:salonID", reservationController.getReservationsBySalonID); // get all pending reservations for a salon
router.get(
  "/employee/processing/:employeeID",
  reservationController.getProcessingReservationsByEmployeeID
);
router.get(
  "/today/:salonID",
  reservationController.getTodaysReservationsBYsalonID
); // get today's reserved reservations/times for a salon
router.get(
  "/employee/completed/:employeeID",
  reservationController.getCompletedReservationsByEmployeeID
);
router.put("/:resID/status", reservationController.updateStatus); // update a reservation status from salon(employee)
module.exports = router;
