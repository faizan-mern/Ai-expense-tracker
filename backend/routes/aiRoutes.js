const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { parseExpense } = require("../controllers/aiController");
const {
  getAiSettings,
  saveAiSettings,
  getAvailableModels,
} = require("../controllers/aiSettingsController");

const router = express.Router();

router.use(authMiddleware);

router.get("/settings", getAiSettings);
router.post("/settings", saveAiSettings);
router.get("/models", getAvailableModels);
router.post("/parse-expense", parseExpense);

module.exports = router;
