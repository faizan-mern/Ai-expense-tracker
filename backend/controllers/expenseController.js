const pool = require("../db");
const { evaluateAlertsForExpense } = require("../services/budgetAlertService");

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function normalizeNote(note) {
  if (note === undefined || note === null || note === "") {
    return null;
  }

  return String(note).trim();
}

async function findAccessibleCategory(categoryId, userId) {
  const result = await pool.query(
    `SELECT id, name, is_default, user_id
     FROM categories
     WHERE id = $1
       AND (user_id IS NULL OR user_id = $2)`,
    [categoryId, userId]
  );

  return result.rows[0] || null;
}

async function findExpenseById(expenseId, userId) {
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
     WHERE e.id = $1 AND e.user_id = $2`,
    [expenseId, userId]
  );

  return result.rows[0] || null;
}

function mapExpenseRow(row) {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    categoryId: Number(row.category_id),
    categoryName: row.category_name,
    amount: Number(row.amount),
    expenseDate: row.expense_date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
    const category = await findAccessibleCategory(categoryId, userId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or not accessible",
      });
    }

    const insertResult = await pool.query(
      `INSERT INTO expenses (user_id, category_id, amount, expense_date, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, category.id, parsedAmount, expenseDate, normalizeNote(note)]
    );

    const savedExpense = await findExpenseById(insertResult.rows[0].id, userId);
    const mappedExpense = mapExpenseRow(savedExpense);

    await evaluateAlertsForExpense(mappedExpense);

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense: mappedExpense,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create expense",
      error: error.message,
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
      error: error.message,
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
    const existingExpense = await findExpenseById(expenseId, userId);

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const category = await findAccessibleCategory(categoryId, userId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or not accessible",
      });
    }

    await pool.query(
      `UPDATE expenses
       SET category_id = $1,
           amount = $2,
           expense_date = $3,
           note = $4,
           updated_at = NOW()
       WHERE id = $5 AND user_id = $6`,
      [category.id, parsedAmount, expenseDate, normalizeNote(note), expenseId, userId]
    );

    const updatedExpense = await findExpenseById(expenseId, userId);
    const mappedExpense = mapExpenseRow(updatedExpense);

    await evaluateAlertsForExpense(mappedExpense);

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expense: mappedExpense,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update expense",
      error: error.message,
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
      error: error.message,
    });
  }
}

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
};
