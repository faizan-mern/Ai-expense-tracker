import { useEffect, useMemo, useState } from "react";
import { fetchCategories } from "../api/categoryApi";
import { useToast } from "../components/ui/Toast";
import { deleteBudget, fetchBudgets, saveBudget } from "../api/budgetApi";
import { fetchExpenses } from "../api/expenseApi";
import {
  MONTH_OPTIONS,
  buildBudgetMonthValue,
  formatCurrency,
  formatMonthLabel,
  getCurrentMonthValue,
  getMonthDateRange,
  getYearOptions,
  splitBudgetMonth,
} from "../utils/formatters";

const initialForm = {
  amount: "",
  categoryId: "",
};

export default function BudgetsPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [monthExpenses, setMonthExpenses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const { year: selectedYear, month: selectedMonthNumber } = splitBudgetMonth(selectedMonth);

  useEffect(() => {
    let isCancelled = false;

    async function loadCategories() {
      try {
        const response = await fetchCategories();

        if (!isCancelled) {
          setCategories(response.categories);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.message);
        }
      }
    }

    loadCategories();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadBudgetWorkspace() {
      setIsLoading(true);
      setError("");

      try {
        const { startDate, endDate } = getMonthDateRange(selectedMonth);
        const [budgetsResponse, expensesResponse] = await Promise.all([
          fetchBudgets(selectedMonth),
          fetchExpenses({ startDate, endDate }),
        ]);

        if (!isCancelled) {
          setBudgets(budgetsResponse.budgets);
          setMonthExpenses(expensesResponse.expenses);
          setIsLoading(false);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.message);
          setIsLoading(false);
        }
      }
    }

    loadBudgetWorkspace();

    return () => {
      isCancelled = true;
    };
  }, [selectedMonth]);

  async function refreshBudgetWorkspace(activeMonth = selectedMonth) {
    const { startDate, endDate } = getMonthDateRange(activeMonth);
    const [budgetsResponse, expensesResponse] = await Promise.all([
      fetchBudgets(activeMonth),
      fetchExpenses({ startDate, endDate }),
    ]);

    setBudgets(budgetsResponse.budgets);
    setMonthExpenses(expensesResponse.expenses);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await saveBudget({
        amount: Number(form.amount),
        budgetMonth: selectedMonth,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
      });

      setForm(initialForm);
      await refreshBudgetWorkspace();
      showToast("Budget saved", "success");
    } catch (submitError) {
      setError(submitError.message);
      showToast(submitError.message, "error");
    }
  }

  async function handleDelete(budgetId) {
    setError("");

    if (!window.confirm("Delete this budget?")) {
      return;
    }

    try {
      await deleteBudget(budgetId);
      await refreshBudgetWorkspace();
      showToast("Budget deleted", "success");
    } catch (deleteError) {
      setError(deleteError.message);
      showToast(deleteError.message, "error");
    }
  }

  const overallBudget = budgets.find((budget) => budget.categoryId === null) || null;
  const categoryBudgets = budgets.filter((budget) => budget.categoryId !== null);
  const totalSpent = useMemo(
    () => monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [monthExpenses]
  );
  const remaining = overallBudget ? Number(overallBudget.amount) - totalSpent : null;
  const availableYears = getYearOptions();

  function handleMonthPartChange(nextValue, part) {
    const nextYear = part === "year" ? nextValue : selectedYear;
    const nextMonthNumber = part === "month" ? nextValue : selectedMonthNumber;
    setSelectedMonth(buildBudgetMonthValue(nextYear, nextMonthNumber));
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Budgets</p>
          <h2>Plan {formatMonthLabel(selectedMonth)} with live usage.</h2>
          <p className="page-copy">
            Choose a month first, then review the totals, overall cap, and category budgets in one place.
          </p>
        </div>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="panel panel--soft">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Month selector</p>
            <h3>Budget month</h3>
          </div>
          <span className="status-pill">{formatMonthLabel(selectedMonth)}</span>
        </div>
        <div className="field-grid field-grid--month">
          <label>
            Month
            <select
              value={selectedMonthNumber}
              onChange={(event) => handleMonthPartChange(event.target.value, "month")}
            >
              {MONTH_OPTIONS.map((monthOption) => (
                <option key={monthOption.value} value={monthOption.value}>
                  {monthOption.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Year
            <select
              value={selectedYear}
              onChange={(event) => handleMonthPartChange(event.target.value, "year")}
            >
              {availableYears.map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="metric-grid">
        <article className="metric-card">
          <p className="eyebrow">Spent this month</p>
          <strong>{formatCurrency(totalSpent)}</strong>
          <span>{monthExpenses.length} expenses inside {formatMonthLabel(selectedMonth)}</span>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Overall budget</p>
          <strong>{overallBudget ? formatCurrency(overallBudget.amount) : "Not set"}</strong>
          <span>
            {overallBudget
              ? `${formatCurrency(Math.max(remaining, 0))} remaining`
              : "Create one overall monthly cap for this month"}
          </span>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Category budgets</p>
          <strong>{categoryBudgets.length}</strong>
          <span>Focused caps for specific spending areas</span>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Usage</p>
          <strong>{overallBudget ? `${overallBudget.percentUsed}%` : "0%"}</strong>
          <span>
            {overallBudget
              ? "Calculated from actual expenses in this month"
              : "Usage appears once an overall budget is added"}
          </span>
        </article>
      </div>

      <div className="workspace-grid">
        <section className="panel panel--soft">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Save budget</p>
              <h3>New budget for {formatMonthLabel(selectedMonth)}</h3>
            </div>
          </div>
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                required
              />
            </label>
            <label>
              Category budget
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, categoryId: event.target.value }))
                }
              >
                <option value="">Overall monthly budget</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="primary-button">
              Save budget
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Summary</p>
              <h3>Overall monthly budget</h3>
            </div>
          </div>
          {overallBudget ? (
            <article className="budget-card budget-card--hero">
              <div className="budget-card__header">
                <div>
                  <strong>Overall monthly budget</strong>
                  <span>{formatMonthLabel(selectedMonth)}</span>
                </div>
                <strong>{overallBudget.percentUsed}%</strong>
              </div>
              <div className="progress-track">
                <span style={{ width: `${Math.min(overallBudget.percentUsed, 100)}%` }} />
              </div>
              <div className="budget-card__meta">
                <span>Spent {formatCurrency(totalSpent)}</span>
                <span>Budget {formatCurrency(overallBudget.amount)}</span>
              </div>
              <div className="budget-card__meta">
                <span>
                  {remaining >= 0
                    ? `${formatCurrency(remaining)} remaining`
                    : `${formatCurrency(Math.abs(remaining))} over budget`}
                </span>
                <button
                  type="button"
                  className="text-button danger"
                  onClick={() => handleDelete(overallBudget.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ) : (
            <p className="empty-state">
              No overall budget exists for this month yet. Add one to unlock a clearer usage benchmark.
            </p>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Category budgets</p>
            <h3>Budget breakdown for {formatMonthLabel(selectedMonth)}</h3>
          </div>
          <span>{categoryBudgets.length} entries</span>
        </div>
        {isLoading ? (
          <div className="loading-pulse">Loading...</div>
        ) : categoryBudgets.length === 0 ? (
          <p className="empty-state">No category budgets saved for this month yet.</p>
        ) : (
          <div className="stack-group">
            {categoryBudgets.map((budget) => (
              <article key={budget.id} className="budget-card">
                <div className="budget-card__header">
                  <div>
                    <strong>{budget.categoryName}</strong>
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
                <div className="budget-card__meta">
                  <span>
                    {budget.spent > budget.amount
                      ? `${formatCurrency(budget.spent - budget.amount)} over budget`
                      : `${formatCurrency(budget.amount - budget.spent)} remaining`}
                  </span>
                  <button
                    type="button"
                    className="text-button danger"
                    onClick={() => handleDelete(budget.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
