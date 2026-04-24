const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
} = require("../controllers/alertController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAlerts);
router.patch("/read-all", markAllAlertsAsRead);
router.patch("/:id/read", markAlertAsRead);

module.exports = router;
