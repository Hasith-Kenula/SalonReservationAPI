const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification");

router.post("/save-token", notificationController.saveToken);
router.post("/send-notification", notificationController.sendNotification);

module.exports = router;
