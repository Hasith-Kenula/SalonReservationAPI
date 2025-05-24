const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employee");

router.get("/", employeeController.getAll);
router.get("/:salonID", employeeController.getAllBySalon); // get employees by salonID
router.post("/create", employeeController.create);
router.post("/login", employeeController.login);
router.put("/:empID", employeeController.update);
router.delete("/:empID", employeeController.delete);

module.exports = router;
