const express = require("express");
const router = express.Router();
const emailController = require("../controllers/email");

router.post("/sendOTP", emailController.sendOTP);
router.post("/verifyOTP", emailController.verifiyOTP);

module.exports = router;
