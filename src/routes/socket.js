const express = require("express");
const router = express.Router();
const socketController = require("../controllers/socket");

router.post(
  "/getCustomerConfirmation",
  socketController.getCustomerConfirmation
);

module.exports = router;
