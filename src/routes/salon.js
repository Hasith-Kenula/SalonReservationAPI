const express = require("express");
const router = express.Router();

const salonController = require("../controllers/salon");

router.get("/", salonController.getAll); // get all salons
router.post("/register", salonController.register); // register a new salon
router.post("/login", salonController.login); //login a salon

router.get("/:salonID", salonController.getSpecific); // get specific salon by ID
router.put("/:salonID", salonController.update);

module.exports = router;
