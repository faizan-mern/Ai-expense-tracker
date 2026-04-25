import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

function getBudgetBarColor(pct) {
  if (pct >= 100) return "var(--danger)";
  if (pct >= 80) return "var(--warning)";
  return "var(--accent)";
}

const ON_TRACK_COLOR = "#177B5A";
const NEAR_LIMIT_COLOR = "#e67e22";
const OVER_BUDGET_COLOR = "#c0392b";

const viewAllLinkStyle = {
  color: "var(--muted)",
  fontSize: "0.8rem",
  fontWeight: 600,
};

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

  const dailySpendData = Array.from(
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
    }))
    .sort((left, right) => left.expenseDate.localeCompare(right.expenseDate));
  const dailySpendChartData = dailySpendData.reduce((accumulator, day) => {
    const previousCumulative = accumulator.length > 0
      ? accumulator[accumulator.length - 1].cumulativeSpent
      : 0;
    const cumulativeSpent = previousCumulative + Number(day.amount);
    let barColor = ON_TRACK_COLOR;

    if (overallBudget && Number(overallBudget.amount) > 0) {
      const pct = (cumulativeSpent / Number(overallBudget.amount)) * 100;
      if (pct >= 100) {
        barColor = OVER_BUDGET_COLOR;
      } else if (pct >= 80) {
        barColor = NEAR_LIMIT_COLOR;
      }
    }

    accumulator.push({
      ...day,
      cumulativeSpent,
      barColor,
    });

    return accumulator;
  }, []);

  return (
    <section className="page">
      {/* Page header */}
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Monthly overview</h2>
          <p className="page-copy">
            Monitor spending, budget usage, and unread alerts for the current month.
          </p>
        </div>
        <Badge variant="default">{formatMonthLabel(currentMonth)}</Badge>
      </header>

      {state.error ? (
        <div className="form-error">
          <AlertCircle size={18} />
          <p>{state.error}</p>
        </div>
      ) : null}

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

      {/* Daily spend summary */}
      <Card>
        <CardHeader>
          <CardTitle eyebrow="Daily spend">Summary</CardTitle>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {formatMonthLabel(currentMonth)}
          </span>
        </CardHeader>
        <CardContent>
          {state.isLoading ? (
            <div className="loading-pulse">Loading spend summary...</div>
          ) : dailySpendData.length === 0 ? (
            <p className="empty-state">No spending data for this month yet.</p>
          ) : (
            <div className="stack-group">
              <div style={{ width: "100%" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dailySpendChartData}>
                    <XAxis dataKey="dateLabel" interval="preserveStartEnd" />
                    <YAxis hide={true} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                      {dailySpendChartData.map((entry) => (
                        <Cell key={entry.expenseDate} fill={entry.barColor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.9rem",
                    marginTop: "0.45rem",
                    color: "var(--muted)",
                    fontSize: "0.78rem",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: ON_TRACK_COLOR }} />
                    On track
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: NEAR_LIMIT_COLOR }} />
                    Near limit
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: OVER_BUDGET_COLOR }} />
                    Over budget
                  </span>
                </div>
              </div>

            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent + Budget grid */}
      <div className="workspace-grid">
        {/* Recent expenses */}
        <Card soft>
          <CardHeader>
            <CardTitle eyebrow="Recent activity">Latest expenses</CardTitle>
            <div style={{ display: "grid", justifyItems: "end", gap: "0.25rem" }}>
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {state.expenses.length} this month
              </span>
              <Link to="/expenses" style={viewAllLinkStyle}>
                View all &rarr;
              </Link>
            </div>
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
                      <span className="text-sm" style={{ color: "var(--muted)" }}>
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
            <Link to="/budgets" style={viewAllLinkStyle}>
              View all &rarr;
            </Link>
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
                          <span className="text-xs" style={{ color: "var(--muted)" }}>
                            {formatMonthLabel(budget.budgetMonth)}
                          </span>
                        </div>
                        <strong className="text-sm">{budget.percentUsed}%</strong>
                      </div>
                      <div className="progress-track">
                        <span
                          style={{
                            width: `${Math.min(budget.percentUsed, 100)}%`,
                            background: getBudgetBarColor(budget.percentUsed),
                          }}
                        />
                      </div>
                      <div className="budget-card__meta">
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          Spent {formatCurrency(budget.spent)}
                        </span>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
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
          <div style={{ display: "grid", justifyItems: "end", gap: "0.25rem" }}>
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              {state.alerts.length} total
            </span>
            <Link to="/alerts" style={viewAllLinkStyle}>
              View all &rarr;
            </Link>
          </div>
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
                      {({ near_limit: "Approaching limit", budget_exceeded: "Budget exceeded", unusual_expense: "Unusual spend" })[alert.alertType] ?? alert.alertType.replace(/_/g, " ")}
                    </strong>
                    <span className="text-sm" style={{ color: "var(--muted)" }}>
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
