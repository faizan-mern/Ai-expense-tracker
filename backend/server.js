const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("./config/env");

// Fail fast if required env vars are still set to template placeholders.
const ENV_PLACEHOLDERS = {
  DATABASE_URL: "postgresql://postgres:your_password@localhost:5432/ai_expense_tracker",
  JWT_SECRET: "replace_with_a_long_random_secret",
};

for (const [key, placeholder] of Object.entries(ENV_PLACEHOLDERS)) {
  const value = process.env[key];
  if (!value || value.trim() === "" || value === placeholder) {
    console.error(
      `[FATAL] Invalid ${key}. Set a real value in backend/.env before starting the server.`
    );
    process.exit(1);
  }
}

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const alertRoutes = require("./routes/alertRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();
app.set("trust proxy", 1);
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts. Please try again in 15 minutes.",
  },
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is healthy",
    service: "ai-expense-tracker-backend",
  });
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/ai", aiRoutes);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
