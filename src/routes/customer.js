const express = require("express");
const customerController = require("../controllers/customer.js");

const router = express.Router();

router.get("/", customerController.getAll); //get all customers
router.post("/register", customerController.register); //register a new customer
router.post("/login", customerController.login);
router.get("/:customerID", customerController.getSpecific); //get one customer by id

module.exports = router;
