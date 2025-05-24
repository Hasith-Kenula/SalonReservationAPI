const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employee");

router.post("/create", employeeController.create);

module.exports = router;
