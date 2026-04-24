import { useEffect, useState } from "react";
import { createCategory, fetchCategories } from "../api/categoryApi";
import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  updateExpense,
} from "../api/expenseApi";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, MetricCard } from "../components/ui/Card";
import { Pagination } from "../components/ui/Pagination";
import { formatCurrency, formatDateLabel } from "../utils/formatters";

const ITEMS_PER_PAGE = 10;

function getTodayDateValue() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function createInitialExpenseForm() {
  return { amount: "", categoryId: "", expenseDate: getTodayDateValue(), note: "" };
}

const initialCategoryForm = { name: "" };
const initialFilters = { categoryId: "", startDate: "", endDate: "" };

export default function ExpensesPage() {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState(createInitialExpenseForm);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [filters, setFilters] = useState(initialFilters);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  async function loadExpenses(activeFilters = filters) {
    const response = await fetchExpenses(activeFilters);
    setExpenses(response.expenses);
    setCurrentPage(1);
  }

  useEffect(() => {
    let isCancelled = false;
    async function bootstrap() {
      try {
        const [catsRes, expsRes] = await Promise.all([
          fetchCategories(),
          fetchExpenses(),
        ]);
        if (!isCancelled) {
          setCategories(catsRes.categories);
          setExpenses(expsRes.expenses);
          setIsLoading(false);
        }
      } catch (e) {
        if (!isCancelled) { setError(e.message); setIsLoading(false); }
      }
    }
    bootstrap();
    return () => { isCancelled = true; };
  }, []);

  async function handleExpenseSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = {
      amount: Number(expenseForm.amount),
      categoryId: Number(expenseForm.categoryId),
      expenseDate: expenseForm.expenseDate,
      note: expenseForm.note.trim(),
    };
    try {
      editingId ? await updateExpense(editingId, payload) : await createExpense(payload);
      setExpenseForm(createInitialExpenseForm());
      setEditingId(null);
      await loadExpenses();
    } catch (err) { setError(err.message); }
  }

  async function handleCategorySubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await createCategory({ name: categoryForm.name });
      setCategories((cur) => [...cur, res.category].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryForm(initialCategoryForm);
    } catch (err) { setError(err.message); }
  }

  async function handleApplyFilters(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try { await loadExpenses(filters); } catch (err) { setError(err.message); } finally { setIsLoading(false); }
  }

  async function handleClearFilters() {
    setError("");
    setIsLoading(true);
    try { setFilters(initialFilters); await loadExpenses(initialFilters); }
    catch (err) { setError(err.message); } finally { setIsLoading(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense? This cannot be undone.")) return;
    setError("");
    try { await deleteExpense(id); await loadExpenses(); } catch (err) { setError(err.message); }
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

  const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = expenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalFilteredSpend = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const customCategories = categories.filter((c) => !c.isDefault).length;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Expenses</p>
          <h2>Capture every spend with less friction.</h2>
          <p className="page-copy">Add transactions, keep categories tidy, and review your ledger.</p>
        </div>
        <Badge variant="default">{expenses.length} visible</Badge>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="metric-grid" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
        <MetricCard eyebrow="Filtered spend" value={formatCurrency(totalFilteredSpend)} description="Across the entries shown below" />
        <MetricCard eyebrow="Visible entries" value={expenses.length} description="Records in the current view" />
        <MetricCard eyebrow="Categories" value={categories.length} description={`${customCategories} custom categories`} />
      </div>

      <div className="workspace-grid">
        <Card soft>
          <CardHeader>
            <CardTitle eyebrow={editingId ? "Editing" : "New expense"}>
              {editingId ? "Update expense" : "Add expense"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="stack-form" onSubmit={handleExpenseSubmit}>
              <div className="field-grid">
                <label>
                  Amount
                  <input type="number" min="0.01" step="0.01" value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((c) => ({ ...c, amount: e.target.value }))} required />
                </label>
                <label>
                  Date
                  <input type="date" value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm((c) => ({ ...c, expenseDate: e.target.value }))} required />
                </label>
              </div>
              <label>
                Category
                <select value={expenseForm.categoryId}
                  onChange={(e) => setExpenseForm((c) => ({ ...c, categoryId: e.target.value }))} required>
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Note
                <textarea rows="3" value={expenseForm.note}
                  onChange={(e) => setExpenseForm((c) => ({ ...c, note: e.target.value }))}
                  placeholder="Optional detail about the purchase" />
              </label>
              <div className="button-row">
                <Button type="submit" variant="primary">{editingId ? "Update expense" : "Save expense"}</Button>
                {editingId && <Button type="button" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle eyebrow="Categories">Create custom category</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="stack-form" onSubmit={handleCategorySubmit}>
              <label>
                Category name
                <input type="text" value={categoryForm.name}
                  onChange={(e) => setCategoryForm((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Transport, Family, Office" required />
              </label>
              <Button type="submit" variant="secondary">Add category</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card soft>
        <CardHeader>
          <CardTitle eyebrow="Filters">Filter the ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="field-grid field-grid--filters" onSubmit={handleApplyFilters}>
            <label>
              Category
              <select value={filters.categoryId}
                onChange={(e) => setFilters((c) => ({ ...c, categoryId: e.target.value }))}>
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </label>
            <label>
              Start date
              <input type="date" value={filters.startDate}
                onChange={(e) => setFilters((c) => ({ ...c, startDate: e.target.value }))} />
            </label>
            <label>
              End date
              <input type="date" value={filters.endDate}
                onChange={(e) => setFilters((c) => ({ ...c, endDate: e.target.value }))} />
            </label>
            <div className="align-end">
              <div className="button-row">
                <Button type="submit" variant="secondary" size="md">Apply</Button>
                <Button type="button" variant="ghost" size="md" onClick={handleClearFilters}>Clear</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle eyebrow="History">Expense history</CardTitle>
          <span className="text-sm text-[#63736b]">{expenses.length} entries</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="empty-state">Loading expenses...</p>
          ) : expenses.length === 0 ? (
            <p className="empty-state">No expenses found for the current selection.</p>
          ) : (
            <>
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
                    {paginatedExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{formatDateLabel(expense.expenseDate)}</td>
                        <td>{expense.categoryName}</td>
                        <td><strong>{formatCurrency(expense.amount)}</strong></td>
                        <td className="text-sm text-[#63736b]">{expense.note || "—"}</td>
                        <td>
                          <div className="table-actions">
                            <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(expense)}>Edit</Button>
                            <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(expense.id)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
