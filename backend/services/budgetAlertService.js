const pool = require("../db");

function getMonthStartFromDate(dateString) {
  return `${dateString.slice(0, 7)}-01`;
}

function getNextMonthStart(monthStart) {
  const [year, month] = monthStart.split("-").map(Number);
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  return nextMonthDate.toISOString().slice(0, 10);
}

function getMonthLabel(monthStart) {
  const date = new Date(`${monthStart}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-PK", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

async function createAlertIfMissing({
  userId,
  expenseId = null,
  budgetId = null,
  alertType,
  message,
  monthStart = null,
}) {
  let existingAlertResult;

  if (alertType === "unusual_expense" && expenseId) {
    existingAlertResult = await pool.query(
      `SELECT id
       FROM alerts
       WHERE user_id = $1
         AND expense_id = $2
         AND alert_type = $3
       LIMIT 1`,
      [userId, expenseId, alertType]
    );
  } else if (budgetId && monthStart) {
    const nextMonthStart = getNextMonthStart(monthStart);

    existingAlertResult = await pool.query(
      `SELECT id
       FROM alerts
       WHERE user_id = $1
         AND budget_id = $2
         AND alert_type = $3
         AND created_at >= $4::date
         AND created_at < $5::date
       LIMIT 1`,
      [userId, budgetId, alertType, monthStart, nextMonthStart]
    );
  } else {
    existingAlertResult = { rows: [] };
  }

  if (existingAlertResult.rows.length > 0) {
    return;
  }

  await pool.query(
    `INSERT INTO alerts (user_id, expense_id, budget_id, alert_type, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, expenseId, budgetId, alertType, message]
  );
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

async function evaluateBudgetThresholds(budgetRow, triggeringExpenseId = null) {
  if (!budgetRow) {
    return;
  }

  const budgetAmount = Number(budgetRow.amount);
  const spent = Number(budgetRow.spent);
  const monthLabel = getMonthLabel(budgetRow.budget_month);

  let subject = `${monthLabel} monthly budget`;

  if (budgetRow.category_id) {
    subject = `${budgetRow.category_name} budget for ${monthLabel}`;
  }

  if (spent > budgetAmount) {
    await createAlertIfMissing({
      userId: Number(budgetRow.user_id),
      expenseId: triggeringExpenseId,
      budgetId: Number(budgetRow.id),
      alertType: "budget_exceeded",
      message: `You have exceeded your ${subject}. Spent ${formatCurrency(spent)} against a budget of ${formatCurrency(budgetAmount)}.`,
      monthStart: budgetRow.budget_month,
    });
    return;
  }

  if (spent >= budgetAmount * 0.8) {
    await createAlertIfMissing({
      userId: Number(budgetRow.user_id),
      expenseId: triggeringExpenseId,
      budgetId: Number(budgetRow.id),
      alertType: "near_limit",
      message: `You are close to your ${subject}. Spent ${formatCurrency(spent)} out of ${formatCurrency(budgetAmount)}.`,
      monthStart: budgetRow.budget_month,
    });
  }
}

async function evaluateBudgetAlertsForBudgetId(budgetId, userId, triggeringExpenseId = null) {
  const budgetRow = await getBudgetWithUsageById(budgetId, userId);
  await evaluateBudgetThresholds(budgetRow, triggeringExpenseId);
}

async function evaluateAlertsForExpense(expense) {
  const monthStart = getMonthStartFromDate(expense.expenseDate);

  const budgetsResult = await pool.query(
    `SELECT id
     FROM budgets
     WHERE user_id = $1
       AND budget_month = $2
       AND (category_id IS NULL OR category_id = $3)`,
    [expense.userId, monthStart, expense.categoryId]
  );

  for (const budget of budgetsResult.rows) {
    await evaluateBudgetAlertsForBudgetId(Number(budget.id), expense.userId, expense.id);
  }

  const unusualExpenseResult = await pool.query(
    `SELECT
       COUNT(*)::int AS expense_count,
       COALESCE(AVG(amount), 0) AS avg_amount
     FROM expenses
     WHERE user_id = $1
       AND category_id = $2
       AND id <> $3`,
    [expense.userId, expense.categoryId, expense.id]
  );

  const stats = unusualExpenseResult.rows[0];
  const previousCount = Number(stats.expense_count);
  const averageAmount = Number(stats.avg_amount);

  if (previousCount >= 3 && averageAmount > 0 && expense.amount >= averageAmount * 1.5) {
    await createAlertIfMissing({
      userId: expense.userId,
      expenseId: expense.id,
      alertType: "unusual_expense",
      message: `This expense looks unusual compared to your normal ${expense.categoryName} spending.`,
    });
  }
}

module.exports = {
  evaluateAlertsForExpense,
  evaluateBudgetAlertsForBudgetId,
};
