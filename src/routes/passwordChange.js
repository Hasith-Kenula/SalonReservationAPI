const express = require("express");
const router = express.Router();

const passwordChangeController = require("../controllers/passwordChange");

router.post("/forgot", passwordChangeController.changePassword); // change forgotten password

module.exports = router;
