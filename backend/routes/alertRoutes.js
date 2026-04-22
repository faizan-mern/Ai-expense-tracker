const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getAlerts,
  markAlertAsRead,
} = require("../controllers/alertController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAlerts);
router.patch("/:id/read", markAlertAsRead);

module.exports = router;
