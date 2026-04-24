import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAlerts } from "../api/alertApi";
import { fetchBudgets } from "../api/budgetApi";
import { fetchExpenses } from "../api/expenseApi";
import {
  formatCurrency,
  formatDateLabel,
  formatMonthLabel,
  getCurrentMonthValue,
  getMonthDateRange,
} from "../utils/formatters";

export default function DashboardPage() {
  const currentMonth = getCurrentMonthValue();
  const [state, setState] = useState({
    isLoading: true,
    error: "",
    expenses: [],
    budgets: [],
    alerts: [],
  });

  useEffect(() => {
    let isCancelled = false;

    async function loadDashboard() {
      try {
        const { startDate, endDate } = getMonthDateRange(currentMonth);
        const [expensesResponse, budgetsResponse, alertsResponse] = await Promise.all([
          fetchExpenses({ startDate, endDate }),
          fetchBudgets(currentMonth),
          fetchAlerts(),
        ]);

        if (!isCancelled) {
          setState({
            isLoading: false,
            error: "",
            expenses: expensesResponse.expenses,
            budgets: budgetsResponse.budgets,
            alerts: alertsResponse.alerts,
          });
        }
      } catch (error) {
        if (!isCancelled) {
          setState((current) => ({
            ...current,
            isLoading: false,
            error: error.message,
          }));
        }
      }
    }

    loadDashboard();

    return () => {
      isCancelled = true;
    };
  }, [currentMonth]);

  const totalSpent = state.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const unreadAlerts = state.alerts.filter((alert) => !alert.isRead).length;
  const overallBudget = state.budgets.find((budget) => budget.categoryId === null) || null;
  const categoryBudgets = state.budgets.filter((budget) => budget.categoryId !== null);
  const remainingBudget = overallBudget
    ? Math.max(Number(overallBudget.amount) - totalSpent, 0)
    : null;

  const spendingChartData = Array.from(
    state.expenses.reduce((groups, expense) => {
      const existingGroup = groups.get(expense.expenseDate) || 0;
      groups.set(expense.expenseDate, existingGroup + Number(expense.amount));
      return groups;
    }, new Map()).entries()
  )
    .map(([expenseDate, amount]) => ({
      expenseDate,
      amount,
      dateLabel: formatDateLabel(expenseDate),
      dayLabel: String(Number(expenseDate.slice(8, 10))),
    }))
    .sort((left, right) => left.expenseDate.localeCompare(right.expenseDate));

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>{formatMonthLabel(currentMonth)} at a glance.</h2>
          <p className="page-copy">
            Review spend, budget pressure, and alert activity without bouncing between modules.
          </p>
        </div>
        <span className="status-pill">{formatMonthLabel(currentMonth)}</span>
      </header>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <div className="metric-grid">
        <article className="metric-card">
          <p className="eyebrow">Month spend</p>
          <strong>{formatCurrency(totalSpent)}</strong>
          <span>{state.expenses.length} expenses logged this month</span>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Monthly budget</p>
          <strong>{overallBudget ? formatCurrency(overallBudget.amount) : "Not set"}</strong>
          <span>
            {overallBudget
              ? `${formatCurrency(remainingBudget)} remaining before the cap`
              : "Add an overall monthly budget from the budgets page"}
          </span>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Category budgets</p>
          <strong>{categoryBudgets.length}</strong>
          <span>Tracked alongside the month-wide budget plan</span>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Unread alerts</p>
          <strong>{unreadAlerts}</strong>
          <span>Signals waiting for review or action</span>
        </article>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Spending chart</p>
            <h3>Daily breakdown</h3>
          </div>
          <span>{formatMonthLabel(currentMonth)}</span>
        </div>
        {state.isLoading ? (
          <div className="loading-pulse">Loading dashboard chart...</div>
        ) : spendingChartData.length === 0 ? (
          <p className="empty-state">No spending data for this month yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={spendingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="dayLabel" />
              <YAxis hide />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.dateLabel || ""}
              />
              <Bar dataKey="amount" fill="#177b5a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <div className="workspace-grid">
        <section className="panel panel--soft">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h3>Latest expenses</h3>
            </div>
            <span>{state.expenses.length} this month</span>
          </div>
          {state.isLoading ? (
            <div className="loading-pulse">Loading recent expenses...</div>
          ) : state.expenses.length === 0 ? (
            <p className="empty-state">
              No expenses yet. Add your first transaction to activate the dashboard.
            </p>
          ) : (
            <ul className="data-list">
              {state.expenses.slice(0, 5).map((expense) => (
                <li key={expense.id}>
                  <div>
                    <strong>{expense.categoryName}</strong>
                    <span>{expense.note || "Expense entry"}</span>
                  </div>
                  <div className="list-meta">
                    <strong>{formatCurrency(expense.amount)}</strong>
                    <small>{formatDateLabel(expense.expenseDate)}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Budget watch</p>
              <h3>Usage snapshot</h3>
            </div>
          </div>
          {state.isLoading ? (
            <div className="loading-pulse">Loading budget usage...</div>
          ) : state.budgets.length === 0 ? (
            <p className="empty-state">No budgets saved for this month yet.</p>
          ) : (
            <div className="panel-scroll-region">
              <div className="stack-group">
                {state.budgets.map((budget) => (
                  <article key={budget.id} className="budget-card">
                    <div className="budget-card__header">
                      <div>
                        <strong>{budget.categoryName || "Overall monthly budget"}</strong>
                        <span>{formatMonthLabel(budget.budgetMonth)}</span>
                      </div>
                      <strong>{budget.percentUsed}%</strong>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${Math.min(budget.percentUsed, 100)}%` }} />
                    </div>
                    <div className="budget-card__meta">
                      <span>Spent {formatCurrency(budget.spent)}</span>
                      <span>Budget {formatCurrency(budget.amount)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Alerts</p>
            <h3>Latest signals</h3>
          </div>
          <span>{state.alerts.length} total</span>
        </div>
        {state.isLoading ? (
          <div className="loading-pulse">Loading alerts...</div>
        ) : state.alerts.length === 0 ? (
          <p className="empty-state">
            No alerts yet. Budget and unusual-spend alerts will appear here.
          </p>
        ) : (
          <ul className="data-list">
            {state.alerts.slice(0, 4).map((alert) => (
              <li key={alert.id}>
                <div>
                  <strong>{alert.alertType.replace(/_/g, " ")}</strong>
                  <span>{alert.message}</span>
                </div>
                <div className="list-meta">
                  <span className={`mini-chip${alert.isRead ? "" : " mini-chip--accent"}`}>
                    {alert.isRead ? "Read" : "Unread"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
