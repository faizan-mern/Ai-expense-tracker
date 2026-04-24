import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchCategories } from "../api/categoryApi";
import { deleteBudget, fetchBudgets, saveBudget } from "../api/budgetApi";
import { fetchExpenses } from "../api/expenseApi";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, MetricCard } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
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

const initialForm = { amount: "", categoryId: "" };

function getBudgetBarColor(pct) {
  if (pct >= 100) return "var(--danger)";
  if (pct >= 80) return "var(--warning)";
  return "var(--accent)";
}

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
        const res = await fetchCategories();
        if (!isCancelled) setCategories(res.categories);
      } catch (e) { if (!isCancelled) setError(e.message); }
    }
    loadCategories();
    return () => { isCancelled = true; };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    async function loadBudgetWorkspace() {
      setIsLoading(true);
      setError("");
      try {
        const { startDate, endDate } = getMonthDateRange(selectedMonth);
        const [budgetsRes, expensesRes] = await Promise.all([
          fetchBudgets(selectedMonth),
          fetchExpenses({ startDate, endDate }),
        ]);
        if (!isCancelled) {
          setBudgets(budgetsRes.budgets);
          setMonthExpenses(expensesRes.expenses);
          setIsLoading(false);
        }
      } catch (e) {
        if (!isCancelled) { setError(e.message); setIsLoading(false); }
      }
    }
    loadBudgetWorkspace();
    return () => { isCancelled = true; };
  }, [selectedMonth]);

  async function refreshBudgetWorkspace(activeMonth = selectedMonth) {
    const { startDate, endDate } = getMonthDateRange(activeMonth);
    const [budgetsRes, expensesRes] = await Promise.all([
      fetchBudgets(activeMonth),
      fetchExpenses({ startDate, endDate }),
    ]);
    setBudgets(budgetsRes.budgets);
    setMonthExpenses(expensesRes.expenses);
  }

  async function handleSubmit(e) {
    e.preventDefault();
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
    } catch (err) { setError(err.message); showToast(err.message, "error"); }
  }

  async function handleDelete(budgetId) {
    if (!window.confirm("Delete this budget?")) return;
    setError("");
    try {
      await deleteBudget(budgetId);
      await refreshBudgetWorkspace();
      showToast("Budget deleted", "success");
    } catch (err) { setError(err.message); showToast(err.message, "error"); }
  }

  const overallBudget = budgets.find((b) => b.categoryId === null) || null;
  const categoryBudgets = budgets.filter((b) => b.categoryId !== null);
  const totalSpent = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
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
            Monthly limits, category caps, and live usage in one view.
          </p>
        </div>
      </header>

      {error ? (
        <div className="form-error">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      ) : null}

      {/* Month selector */}
      <Card soft>
        <CardHeader>
          <CardTitle eyebrow="Month selector">Budget month</CardTitle>
          <span className="text-sm font-semibold text-[#177b5a] bg-emerald-50 px-3 py-1 rounded-full">
            {formatMonthLabel(selectedMonth)}
          </span>
        </CardHeader>
        <CardContent>
          <div className="field-grid field-grid--month">
            <label>
              Month
              <select value={selectedMonthNumber} onChange={(e) => handleMonthPartChange(e.target.value, "month")}>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </label>
            <label>
              Year
              <select value={selectedYear} onChange={(e) => handleMonthPartChange(e.target.value, "year")}>
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="metric-grid">
        <MetricCard
          eyebrow="Spent this month"
          value={formatCurrency(totalSpent)}
          description={`${monthExpenses.length} expenses in ${formatMonthLabel(selectedMonth)}`}
        />
        <MetricCard
          eyebrow="Overall budget"
          value={overallBudget ? formatCurrency(overallBudget.amount) : "Not set"}
          description={overallBudget ? `${formatCurrency(Math.max(remaining, 0))} remaining` : "Create a monthly cap"}
        />
        <MetricCard
          eyebrow="Category budgets"
          value={categoryBudgets.length}
          description="Focused caps for spending areas"
        />
        <MetricCard
          eyebrow="Usage"
          value={overallBudget ? `${overallBudget.percentUsed}%` : "0%"}
          description={overallBudget ? "Of overall monthly budget used" : "Add a budget to track usage"}
        />
      </div>

      {/* Save form + Overall budget */}
      <div className="workspace-grid">
        <Card soft>
          <CardHeader>
            <CardTitle eyebrow="Save budget">New budget for {formatMonthLabel(selectedMonth)}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="stack-form" onSubmit={handleSubmit}>
              <label>
                Amount
                <input type="number" min="0.01" step="0.01" value={form.amount}
                  onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))} required />
              </label>
              <label>
                Category budget
                <select value={form.categoryId} onChange={(e) => setForm((c) => ({ ...c, categoryId: e.target.value }))}>
                  <option value="">Overall monthly budget</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </label>
              <Button type="submit" variant="primary">Save budget</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle eyebrow="Summary">Overall monthly budget</CardTitle>
          </CardHeader>
          <CardContent>
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
                  <span style={{
                    width: `${Math.min(overallBudget.percentUsed, 100)}%`,
                    background: getBudgetBarColor(overallBudget.percentUsed),
                  }} />
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
                  <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(overallBudget.id)}>
                    Delete
                  </Button>
                </div>
              </article>
            ) : (
              <p className="empty-state">
                No monthly cap yet. Add one to track overall usage.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category budgets */}
      <Card>
        <CardHeader>
          <CardTitle eyebrow="Category budgets">Breakdown for {formatMonthLabel(selectedMonth)}</CardTitle>
          <span className="text-sm text-[#63736b]">{categoryBudgets.length} entries</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="loading-pulse">Loading budget breakdown...</div>
          ) : categoryBudgets.length === 0 ? (
            <p className="empty-state">No category budgets saved for this month yet.</p>
          ) : (
            <div className="panel-scroll-region">
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
                      <span style={{
                        width: `${Math.min(budget.percentUsed, 100)}%`,
                        background: getBudgetBarColor(budget.percentUsed),
                      }} />
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
                      <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(budget.id)}>
                        Delete
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
