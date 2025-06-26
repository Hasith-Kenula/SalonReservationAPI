const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripePayment");

router.post("/payment-secret", stripeController.paymentSecret);
router.post("/payment-sheet", stripeController.paymentSheet);

module.exports = router;
