const express = require("express");
const router = express.Router();
const locationController = require("../controllers/location");

router.post(
  "/save-location/customer/:customerID",
  locationController.saveCustomerLocation
);
router.post(
  "/save-location/salon/:salonID",
  locationController.saveSalonLocation
);

module.exports = router;
