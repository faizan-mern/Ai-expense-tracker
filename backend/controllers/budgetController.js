const pool = require("../db");
const { findAccessibleCategoryById } = require("../services/categoryService");
const {
  evaluateBudgetAlertsForBudgetId,
} = require("../services/budgetAlertService");

function parseBudgetMonth(value) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value.slice(0, 7)}-01`;
  }

  return null;
}

function mapBudgetRow(row) {
  const amount = Number(row.amount);
  const spent = Number(row.spent);

  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    categoryId: row.category_id === null ? null : Number(row.category_id),
    categoryName: row.category_name || null,
    budgetMonth: row.budget_month,
    amount,
    spent,
    remaining: Math.max(amount - spent, 0),
    percentUsed: amount > 0 ? Number(((spent / amount) * 100).toFixed(2)) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getBudgetWithUsageById(budgetId, userId) {
  const result = await pool.query(
    `SELECT
       b.id,
       b.user_id,
       b.category_id,
       c.name AS category_name,
       TO_CHAR(b.budget_month, 'YYYY-MM-DD') AS budget_month,
       b.amount,
       b.created_at,
       b.updated_at,
       COALESCE(SUM(e.amount), 0) AS spent
     FROM budgets b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN expenses e
       ON e.user_id = b.user_id
      AND e.expense_date >= b.budget_month
      AND e.expense_date < (b.budget_month + INTERVAL '1 month')
      AND (b.category_id IS NULL OR e.category_id = b.category_id)
     WHERE b.id = $1 AND b.user_id = $2
     GROUP BY b.id, c.name`,
    [budgetId, userId]
  );

  return result.rows[0] || null;
}

async function upsertBudget(req, res) {
  const { amount, budgetMonth, categoryId } = req.body || {};
  const userId = req.user.userId;

  const normalizedBudgetMonth = parseBudgetMonth(budgetMonth);
  const parsedAmount = Number(amount);

  if (!normalizedBudgetMonth) {
    return res.status(400).json({
      success: false,
      message: "budgetMonth is required and must be YYYY-MM or YYYY-MM-DD",
    });
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be a number greater than 0",
    });
  }

  try {
    let normalizedCategoryId = null;

    if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
      const category = await findAccessibleCategoryById(categoryId, userId);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found or not accessible",
        });
      }

      normalizedCategoryId = Number(category.id);
    }

    const existingBudgetResult = await pool.query(
      `SELECT id
       FROM budgets
       WHERE user_id = $1
         AND budget_month = $2
         AND (
           (category_id IS NULL AND $3::bigint IS NULL)
           OR category_id = $3
         )
       LIMIT 1`,
      [userId, normalizedBudgetMonth, normalizedCategoryId]
    );

    let budgetId;

    if (existingBudgetResult.rows.length > 0) {
      budgetId = Number(existingBudgetResult.rows[0].id);

      await pool.query(
        `UPDATE budgets
         SET amount = $1,
             updated_at = NOW()
         WHERE id = $2 AND user_id = $3`,
        [parsedAmount, budgetId, userId]
      );
    } else {
      const insertResult = await pool.query(
        `INSERT INTO budgets (user_id, category_id, budget_month, amount)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [userId, normalizedCategoryId, normalizedBudgetMonth, parsedAmount]
      );

      budgetId = Number(insertResult.rows[0].id);
    }

    await evaluateBudgetAlertsForBudgetId(budgetId, userId);
    const savedBudget = await getBudgetWithUsageById(budgetId, userId);

    return res.status(200).json({
      success: true,
      message: "Budget saved successfully",
      budget: mapBudgetRow(savedBudget),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save budget",
      error: error.message,
    });
  }
}

async function getBudgets(req, res) {
  const userId = req.user.userId;
  const normalizedBudgetMonth = req.query.budgetMonth
    ? parseBudgetMonth(req.query.budgetMonth)
    : null;

  if (req.query.budgetMonth && !normalizedBudgetMonth) {
    return res.status(400).json({
      success: false,
      message: "budgetMonth must be YYYY-MM or YYYY-MM-DD",
    });
  }

  const values = [userId];
  let whereClause = "WHERE b.user_id = $1";

  if (normalizedBudgetMonth) {
    values.push(normalizedBudgetMonth);
    whereClause += ` AND b.budget_month = $${values.length}`;
  }

  try {
    const result = await pool.query(
      `SELECT
         b.id,
         b.user_id,
         b.category_id,
         c.name AS category_name,
         TO_CHAR(b.budget_month, 'YYYY-MM-DD') AS budget_month,
         b.amount,
         b.created_at,
         b.updated_at,
         COALESCE(SUM(e.amount), 0) AS spent
       FROM budgets b
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN expenses e
         ON e.user_id = b.user_id
        AND e.expense_date >= b.budget_month
        AND e.expense_date < (b.budget_month + INTERVAL '1 month')
        AND (b.category_id IS NULL OR e.category_id = b.category_id)
       ${whereClause}
       GROUP BY b.id, c.name
       ORDER BY b.budget_month DESC, b.category_id NULLS FIRST, b.id DESC`,
      values
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      budgets: result.rows.map(mapBudgetRow),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch budgets",
      error: error.message,
    });
  }
}

async function deleteBudget(req, res) {
  const budgetId = Number(req.params.id);
  const userId = req.user.userId;

  if (!Number.isInteger(budgetId)) {
    return res.status(400).json({
      success: false,
      message: "Budget id must be a valid number",
    });
  }

  try {
    const result = await pool.query(
      "DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id",
      [budgetId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete budget",
      error: error.message,
    });
  }
}

module.exports = {
  upsertBudget,
  getBudgets,
  deleteBudget,
};
