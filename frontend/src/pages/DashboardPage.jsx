import { useEffect, useState } from "react";
import { fetchExpenses } from "../api/expenseApi";
import { fetchBudgets } from "../api/budgetApi";
import { fetchAlerts } from "../api/alertApi";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function DashboardPage() {
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
        const [expensesResponse, budgetsResponse, alertsResponse] = await Promise.all([
          fetchExpenses(),
          fetchBudgets(),
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
  }, []);

  const totalSpent = state.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const unreadAlerts = state.alerts.filter((alert) => !alert.isRead).length;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Your backend is live. This page turns it into a working product surface.</h2>
        </div>
      </header>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <div className="summary-grid">
        <article className="summary-panel">
          <p className="eyebrow">Total spending</p>
          <strong>{formatCurrency(totalSpent)}</strong>
          <span>{state.expenses.length} recorded expenses</span>
        </article>
        <article className="summary-panel">
          <p className="eyebrow">Budgets</p>
          <strong>{state.budgets.length}</strong>
          <span>monthly and category budget entries</span>
        </article>
        <article className="summary-panel">
          <p className="eyebrow">Unread alerts</p>
          <strong>{unreadAlerts}</strong>
          <span>spending warnings still needing review</span>
        </article>
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>Recent expenses</h3>
          </div>
          {state.isLoading ? (
            <p>Loading expenses...</p>
          ) : state.expenses.length === 0 ? (
            <p>No expenses yet.</p>
          ) : (
            <ul className="compact-list">
              {state.expenses.slice(0, 5).map((expense) => (
                <li key={expense.id}>
                  <strong>{expense.categoryName}</strong>
                  <span>{formatCurrency(expense.amount)}</span>
                  <small>{expense.expenseDate}</small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>Latest alerts</h3>
          </div>
          {state.isLoading ? (
            <p>Loading alerts...</p>
          ) : state.alerts.length === 0 ? (
            <p>No alerts yet.</p>
          ) : (
            <ul className="compact-list">
              {state.alerts.slice(0, 5).map((alert) => (
                <li key={alert.id}>
                  <strong>{alert.alertType.replace(/_/g, " ")}</strong>
                  <span>{alert.message}</span>
                  <small>{alert.isRead ? "Read" : "Unread"}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
