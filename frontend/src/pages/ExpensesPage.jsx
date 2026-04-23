import { useEffect, useState } from "react";
import { createCategory, fetchCategories } from "../api/categoryApi";
import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  updateExpense,
} from "../api/expenseApi";
import { formatCurrency, formatDateLabel } from "../utils/formatters";

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function createInitialExpenseForm() {
  return {
    amount: "",
    categoryId: "",
    expenseDate: getTodayDateValue(),
    note: "",
  };
}

const initialCategoryForm = {
  name: "",
};

const initialFilters = {
  categoryId: "",
  startDate: "",
  endDate: "",
};

export default function ExpensesPage() {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState(createInitialExpenseForm);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [filters, setFilters] = useState(initialFilters);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadExpenses(activeFilters = filters) {
    const response = await fetchExpenses(activeFilters);
    setExpenses(response.expenses);
  }

  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      try {
        const [categoriesResponse, expensesResponse] = await Promise.all([
          fetchCategories(),
          fetchExpenses(),
        ]);

        if (!isCancelled) {
          setCategories(categoriesResponse.categories);
          setExpenses(expensesResponse.expenses);
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

  async function handleExpenseSubmit(event) {
    event.preventDefault();
    setError("");

    const payload = {
      amount: Number(expenseForm.amount),
      categoryId: Number(expenseForm.categoryId),
      expenseDate: expenseForm.expenseDate,
      note: expenseForm.note.trim(),
    };

    try {
      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }

      setExpenseForm(createInitialExpenseForm());
      setEditingId(null);
      await loadExpenses();
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function handleCategorySubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await createCategory({
        name: categoryForm.name,
      });

      setCategories((current) =>
        [...current, response.category].sort((left, right) =>
          left.name.localeCompare(right.name)
        )
      );
      setCategoryForm(initialCategoryForm);
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function handleApplyFilters(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await loadExpenses(filters);
    } catch (filterError) {
      setError(filterError.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(expense) {
    setEditingId(expense.id);
    setExpenseForm({
      amount: String(expense.amount),
      categoryId: String(expense.categoryId),
      expenseDate: expense.expenseDate,
      note: expense.note || "",
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setExpenseForm(createInitialExpenseForm());
  }

  async function handleDelete(expenseId) {
    setError("");

    try {
      await deleteExpense(expenseId);
      await loadExpenses();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  const totalFilteredSpend = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const customCategories = categories.filter((category) => !category.isDefault).length;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Expenses</p>
          <h2>Capture every spend with less friction.</h2>
          <p className="page-copy">
            Add transactions, keep categories tidy, and review your ledger without losing context.
          </p>
        </div>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="metric-grid">
        <article className="metric-card">
          <p className="eyebrow">Filtered spend</p>
          <strong>{formatCurrency(totalFilteredSpend)}</strong>
          <span>Across the entries shown below</span>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Visible entries</p>
          <strong>{expenses.length}</strong>
          <span>Expense records in the current view</span>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Categories</p>
          <strong>{categories.length}</strong>
          <span>{customCategories} custom categories created by you</span>
        </article>
      </div>

      <div className="workspace-grid">
        <section className="panel panel--soft">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{editingId ? "Editing" : "New expense"}</p>
              <h3>{editingId ? "Update expense" : "Add expense"}</h3>
            </div>
          </div>

          <form className="stack-form" onSubmit={handleExpenseSubmit}>
            <div className="field-grid">
              <label>
                Amount
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, amount: event.target.value }))
                  }
                  required
                />
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={expenseForm.expenseDate}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, expenseDate: event.target.value }))
                  }
                  required
                />
              </label>
            </div>

            <label>
              Category
              <select
                value={expenseForm.categoryId}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, categoryId: event.target.value }))
                }
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Note
              <textarea
                rows="4"
                value={expenseForm.note}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="Optional detail about the purchase"
              />
            </label>

            <div className="button-row">
              <button type="submit" className="primary-button">
                {editingId ? "Update expense" : "Save expense"}
              </button>
              {editingId ? (
                <button type="button" className="secondary-button" onClick={handleCancelEdit}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Categories</p>
              <h3>Create custom category</h3>
            </div>
          </div>

          <form className="stack-form" onSubmit={handleCategorySubmit}>
            <label>
              Category name
              <input
                type="text"
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Transport, Family, Office"
                required
              />
            </label>
            <button type="submit" className="secondary-button">
              Add category
            </button>
          </form>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Filters</p>
            <h3>Review the ledger</h3>
          </div>
        </div>

        <form className="field-grid field-grid--filters" onSubmit={handleApplyFilters}>
          <label>
            Category
            <select
              value={filters.categoryId}
              onChange={(event) =>
                setFilters((current) => ({ ...current, categoryId: event.target.value }))
              }
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Start date
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, startDate: event.target.value }))
              }
            />
          </label>

          <label>
            End date
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, endDate: event.target.value }))
              }
            />
          </label>

          <div className="align-end">
            <button type="submit" className="secondary-button">
              Apply filters
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">History</p>
            <h3>Expense history</h3>
          </div>
          <span>{expenses.length} entries</span>
        </div>

        {isLoading ? (
          <p className="empty-state">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="empty-state">No expenses found for the current selection.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{formatDateLabel(expense.expenseDate)}</td>
                    <td>{expense.categoryName}</td>
                    <td>{formatCurrency(expense.amount)}</td>
                    <td>{expense.note || "-"}</td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => handleEdit(expense)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-button danger"
                        onClick={() => handleDelete(expense.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
