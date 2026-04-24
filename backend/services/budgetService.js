const pool = require("../db");

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

module.exports = {
  getBudgetWithUsageById,
};
