const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { parseExpense } = require("../controllers/aiController");

const router = express.Router();

router.use(authMiddleware);

router.post("/parse-expense", parseExpense);

module.exports = router;
