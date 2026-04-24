const pool = require("../db");
const { evaluateAlertsForExpense } = require("./budgetAlertService");
const { findAccessibleCategoryById } = require("./categoryService");

function normalizeNote(note) {
  if (note === undefined || note === null || note === "") {
    return null;
  }

  return String(note).trim();
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

  return result.rows[0] ? mapExpenseRow(result.rows[0]) : null;
}

async function createExpenseForUser({ userId, amount, categoryId, expenseDate, note }) {
  const category = await findAccessibleCategoryById(categoryId, userId);

  if (!category) {
    const error = new Error("Category not found or not accessible");
    error.statusCode = 404;
    throw error;
  }

  const insertResult = await pool.query(
    `INSERT INTO expenses (user_id, category_id, amount, expense_date, note)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, category.id, amount, expenseDate, normalizeNote(note)]
  );

  let savedExpense = null;

  try {
    savedExpense = await findExpenseById(insertResult.rows[0].id, userId);
    await evaluateAlertsForExpense(savedExpense);
  } catch (alertError) {
    if (!savedExpense) {
      throw alertError;
    }

    // Alert evaluation should not block successful expense creation.
  }

  return savedExpense;
}

async function updateExpenseForUser({
  expenseId,
  userId,
  amount,
  categoryId,
  expenseDate,
  note,
  existingExpense,
}) {
  const currentExpense = existingExpense || (await findExpenseById(expenseId, userId));

  if (!currentExpense) {
    const error = new Error("Expense not found");
    error.statusCode = 404;
    throw error;
  }

  const category = await findAccessibleCategoryById(categoryId, userId);

  if (!category) {
    const error = new Error("Category not found or not accessible");
    error.statusCode = 404;
    throw error;
  }

  await pool.query(
    `UPDATE expenses
     SET category_id = $1,
         amount = $2,
         expense_date = $3,
         note = $4,
         updated_at = NOW()
     WHERE id = $5 AND user_id = $6`,
    [category.id, amount, expenseDate, normalizeNote(note), expenseId, userId]
  );

  const updatedExpense = await findExpenseById(expenseId, userId);
  try {
    await evaluateAlertsForExpense(updatedExpense);
  } catch (alertError) {
    // Alert evaluation should not block successful expense update.
  }

  return updatedExpense;
}

module.exports = {
  createExpenseForUser,
  findExpenseById,
  mapExpenseRow,
  updateExpenseForUser,
};
