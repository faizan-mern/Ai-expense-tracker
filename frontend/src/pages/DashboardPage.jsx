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
import { Badge } from "../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle, MetricCard } from "../components/ui/Card";
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
        const [expensesResponse, budgetsResponse, alertsResponse] =
          await Promise.all([
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

  const totalSpent = state.expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );
  const unreadAlerts = state.alerts.filter((alert) => !alert.isRead).length;
  const overallBudget =
    state.budgets.find((budget) => budget.categoryId === null) || null;
  const categoryBudgets = state.budgets.filter(
    (budget) => budget.categoryId !== null
  );
  const remainingBudget = overallBudget
    ? Math.max(Number(overallBudget.amount) - totalSpent, 0)
    : null;

  const spendingChartData = Array.from(
    state.expenses
      .reduce((groups, expense) => {
        const existingGroup = groups.get(expense.expenseDate) || 0;
        groups.set(expense.expenseDate, existingGroup + Number(expense.amount));
        return groups;
      }, new Map())
      .entries()
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
      {/* Page header */}
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>{formatMonthLabel(currentMonth)} at a glance.</h2>
          <p className="page-copy">
            Review spend, budget pressure, and alert activity without bouncing
            between modules.
          </p>
        </div>
        <Badge variant="default">{formatMonthLabel(currentMonth)}</Badge>
      </header>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      {/* Metric cards */}
      <div className="metric-grid">
        <MetricCard
          eyebrow="Month spend"
          value={formatCurrency(totalSpent)}
          description={`${state.expenses.length} expenses logged this month`}
        />
        <MetricCard
          eyebrow="Monthly budget"
          value={overallBudget ? formatCurrency(overallBudget.amount) : "Not set"}
          description={
            overallBudget
              ? `${formatCurrency(remainingBudget)} remaining`
              : "Add a monthly budget from the budgets page"
          }
        />
        <MetricCard
          eyebrow="Category budgets"
          value={categoryBudgets.length}
          description="Tracked category-level limits"
        />
        <MetricCard
          eyebrow="Unread alerts"
          value={unreadAlerts}
          description="Signals waiting for review"
        />
      </div>

      {/* Spending chart */}
      <Card>
        <CardHeader>
          <CardTitle eyebrow="Spending chart">Daily breakdown</CardTitle>
          <span className="text-sm text-[#63736b]">
            {formatMonthLabel(currentMonth)}
          </span>
        </CardHeader>
        <CardContent>
          {state.isLoading ? (
            <div className="loading-pulse">Loading dashboard chart...</div>
          ) : spendingChartData.length === 0 ? (
            <p className="empty-state">No spending data for this month yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={spendingChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.06)"
                />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 12 }} />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.dateLabel || ""
                  }
                />
                <Bar dataKey="amount" fill="#177b5a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent + Budget grid */}
      <div className="workspace-grid">
        {/* Recent expenses */}
        <Card soft>
          <CardHeader>
            <CardTitle eyebrow="Recent activity">Latest expenses</CardTitle>
            <span className="text-sm text-[#63736b]">
              {state.expenses.length} this month
            </span>
          </CardHeader>
          <CardContent>
            {state.isLoading ? (
              <div className="loading-pulse">Loading recent expenses...</div>
            ) : state.expenses.length === 0 ? (
              <p className="empty-state">
                No expenses yet. Add your first transaction.
              </p>
            ) : (
              <ul className="data-list">
                {state.expenses.slice(0, 5).map((expense) => (
                  <li key={expense.id}>
                    <div>
                      <strong className="text-sm">{expense.categoryName}</strong>
                      <span className="text-sm text-[#63736b]">
                        {expense.note || "Expense entry"}
                      </span>
                    </div>
                    <div className="list-meta">
                      <strong className="text-sm">
                        {formatCurrency(expense.amount)}
                      </strong>
                      <small>{formatDateLabel(expense.expenseDate)}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Budget watch */}
        <Card>
          <CardHeader>
            <CardTitle eyebrow="Budget watch">Usage snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            {state.isLoading ? (
              <div className="loading-pulse">Loading budget usage...</div>
            ) : state.budgets.length === 0 ? (
              <p className="empty-state">No budgets saved for this month.</p>
            ) : (
              <div className="panel-scroll-region">
                <div className="stack-group">
                  {state.budgets.map((budget) => (
                    <article key={budget.id} className="budget-card">
                      <div className="budget-card__header">
                        <div>
                          <strong className="text-sm">
                            {budget.categoryName || "Overall monthly budget"}
                          </strong>
                          <span className="text-xs text-[#63736b]">
                            {formatMonthLabel(budget.budgetMonth)}
                          </span>
                        </div>
                        <strong className="text-sm">{budget.percentUsed}%</strong>
                      </div>
                      <div className="progress-track">
                        <span
                          style={{
                            width: `${Math.min(budget.percentUsed, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="budget-card__meta">
                        <span className="text-xs text-[#63736b]">
                          Spent {formatCurrency(budget.spent)}
                        </span>
                        <span className="text-xs text-[#63736b]">
                          Budget {formatCurrency(budget.amount)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts preview */}
      <Card>
        <CardHeader>
          <CardTitle eyebrow="Alerts">Latest signals</CardTitle>
          <span className="text-sm text-[#63736b]">
            {state.alerts.length} total
          </span>
        </CardHeader>
        <CardContent>
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
                    <strong className="text-sm capitalize">
                      {alert.alertType.replace(/_/g, " ")}
                    </strong>
                    <span className="text-sm text-[#63736b]">
                      {alert.message}
                    </span>
                  </div>
                  <div className="list-meta">
                    <Badge variant={alert.isRead ? "muted" : "accent"}>
                      {alert.isRead ? "Read" : "Unread"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
