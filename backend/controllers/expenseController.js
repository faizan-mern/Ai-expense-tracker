const pool = require("../db");
const {
  createExpenseForUser,
  findExpenseById,
  mapExpenseRow,
  updateExpenseForUser,
} = require("../services/expenseService");

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

async function createExpense(req, res) {
  const { amount, categoryId, expenseDate, note } = req.body || {};
  const userId = req.user.userId;

  if (amount === undefined || !categoryId || !expenseDate) {
    return res.status(400).json({
      success: false,
      message: "Amount, categoryId, and expenseDate are required",
    });
  }

  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be a number greater than 0",
    });
  }

  if (!isValidDateString(expenseDate)) {
    return res.status(400).json({
      success: false,
      message: "expenseDate must be in YYYY-MM-DD format",
    });
  }

  try {
    const savedExpense = await createExpenseForUser({
      userId,
      amount: parsedAmount,
      categoryId,
      expenseDate,
      note,
    });

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense: savedExpense,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create expense",
    });
  }
}

async function getExpenses(req, res) {
  const userId = req.user.userId;
  const { categoryId, startDate, endDate } = req.query;

  if (startDate && !isValidDateString(startDate)) {
    return res.status(400).json({
      success: false,
      message: "startDate must be in YYYY-MM-DD format",
    });
  }

  if (endDate && !isValidDateString(endDate)) {
    return res.status(400).json({
      success: false,
      message: "endDate must be in YYYY-MM-DD format",
    });
  }

  const values = [userId];
  const conditions = ["e.user_id = $1"];

  if (categoryId) {
    values.push(categoryId);
    conditions.push(`e.category_id = $${values.length}`);
  }

  if (startDate) {
    values.push(startDate);
    conditions.push(`e.expense_date >= $${values.length}`);
  }

  if (endDate) {
    values.push(endDate);
    conditions.push(`e.expense_date <= $${values.length}`);
  }

  try {
    const result = await pool.query(
      `SELECT
         e.id,
         e.user_id,
         e.category_id,
         c.name AS category_name,
         e.amount,
         TO_CHAR(e.expense_date, 'YYYY-MM-DD') AS expense_date,
         e.note,
         e.created_at,
         e.updated_at
       FROM expenses e
       JOIN categories c ON c.id = e.category_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY e.expense_date DESC, e.id DESC`,
      values
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      expenses: result.rows.map(mapExpenseRow),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
    });
  }
}

async function updateExpense(req, res) {
  const expenseId = Number(req.params.id);
  const userId = req.user.userId;
  const { amount, categoryId, expenseDate, note } = req.body || {};

  if (!Number.isInteger(expenseId)) {
    return res.status(400).json({
      success: false,
      message: "Expense id must be a valid number",
    });
  }

  if (amount === undefined || !categoryId || !expenseDate) {
    return res.status(400).json({
      success: false,
      message: "Amount, categoryId, and expenseDate are required",
    });
  }

  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be a number greater than 0",
    });
  }

  if (!isValidDateString(expenseDate)) {
    return res.status(400).json({
      success: false,
      message: "expenseDate must be in YYYY-MM-DD format",
    });
  }

  try {
    const updatedExpense = await updateExpenseForUser({
      expenseId,
      userId,
      amount: parsedAmount,
      categoryId,
      expenseDate,
      note,
    });

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expense: updatedExpense,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update expense",
    });
  }
}

async function deleteExpense(req, res) {
  const expenseId = Number(req.params.id);
  const userId = req.user.userId;

  if (!Number.isInteger(expenseId)) {
    return res.status(400).json({
      success: false,
      message: "Expense id must be a valid number",
    });
  }

  try {
    const existingExpense = await findExpenseById(expenseId, userId);

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    await pool.query(
      "DELETE FROM expenses WHERE id = $1 AND user_id = $2",
      [expenseId, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete expense",
    });
  }
}

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
};
