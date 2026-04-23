import { useEffect, useState } from "react";
import { fetchCategories } from "../api/categoryApi";
import { deleteBudget, fetchBudgets, saveBudget } from "../api/budgetApi";

const initialForm = {
  amount: "",
  budgetMonth: "",
  categoryId: "",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function BudgetsPage() {
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadBudgets() {
    setIsLoading(true);
    const response = await fetchBudgets();
    setBudgets(response.budgets);
    setIsLoading(false);
  }

  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      try {
        const [categoriesResponse, budgetsResponse] = await Promise.all([
          fetchCategories(),
          fetchBudgets(),
        ]);

        if (!isCancelled) {
          setCategories(categoriesResponse.categories);
          setBudgets(budgetsResponse.budgets);
          setIsLoading(false);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.message);
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await saveBudget({
        amount: Number(form.amount),
        budgetMonth: form.budgetMonth,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
      });

      setForm(initialForm);
      await loadBudgets();
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function handleDelete(budgetId) {
    setError("");

    try {
      await deleteBudget(budgetId);
      await loadBudgets();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Budgets</p>
          <h2>Set monthly ceilings and watch usage update against real spending.</h2>
        </div>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>Save budget</h3>
          </div>
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                required
              />
            </label>
            <label>
              Budget month
              <input
                type="month"
                value={form.budgetMonth}
                onChange={(event) =>
                  setForm((current) => ({ ...current, budgetMonth: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Category budget (optional)
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
            <h3>Current budgets</h3>
            <span>{budgets.length} entries</span>
          </div>
          {isLoading ? (
            <p>Loading budgets...</p>
          ) : budgets.length === 0 ? (
            <p>No budgets saved yet.</p>
          ) : (
            <ul className="budget-list">
              {budgets.map((budget) => (
                <li key={budget.id}>
                  <div>
                    <strong>{budget.categoryName || "Overall monthly budget"}</strong>
                    <p>{budget.budgetMonth}</p>
                    <small>
                      Spent {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}
                    </small>
                  </div>
                  <div className="budget-meta">
                    <span>{budget.percentUsed}% used</span>
                    <button
                      type="button"
                      className="text-button danger"
                      onClick={() => handleDelete(budget.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
