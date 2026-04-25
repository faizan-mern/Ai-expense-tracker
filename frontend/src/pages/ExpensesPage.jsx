import { AlertCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createCategory, fetchCategories } from "../api/categoryApi";
import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  updateExpense,
} from "../api/expenseApi";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Pagination } from "../components/ui/Pagination";
import { useToast } from "../components/ui/Toast";
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
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState(createInitialExpenseForm);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [filters, setFilters] = useState(initialFilters);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedExpenseId, setHighlightedExpenseId] = useState(null);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [showDefaultCategories, setShowDefaultCategories] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const highlightTimeoutRef = useRef(null);

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
      const wasEditing = editingId;
      editingId ? await updateExpense(editingId, payload) : await createExpense(payload);
      setExpenseForm(createInitialExpenseForm());
      setEditingId(null);
      await loadExpenses();
      showToast(wasEditing ? "Expense updated" : "Expense saved", "success");
    } catch (err) { setError(err.message); showToast(err.message, "error"); }
  }

  async function handleCategorySubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await createCategory({ name: categoryForm.name });
      setCategories((cur) => [...cur, res.category].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryForm(initialCategoryForm);
      showToast("Category created", "success");
    } catch (err) { setError(err.message); showToast(err.message, "error"); }
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
    const cleared = initialFilters;
    setFilters(cleared);
    try { await loadExpenses(cleared); }
    catch (err) { setError(err.message); } finally { setIsLoading(false); }
  }

  function handleDeleteRequest(expense) {
    setConfirmingDelete(expense);
  }

  async function handleDeleteConfirm() {
    if (!confirmingDelete) {
      return;
    }

    setError("");
    try {
      await deleteExpense(confirmingDelete.id);
      await loadExpenses();
      showToast("Expense deleted", "success");
      setConfirmingDelete(null);
    } catch (err) { setError(err.message); showToast(err.message, "error"); }
  }

  function handleEdit(expense) {
    setEditingId(expense.id);
    setExpenseForm({
      amount: String(expense.amount),
      categoryId: String(expense.categoryId),
      expenseDate: expense.expenseDate,
      note: expense.note || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setExpenseForm(createInitialExpenseForm());
  }

  const hasActiveFilter = filters.categoryId || filters.startDate || filters.endDate;
  const focusedExpenseId = Number(searchParams.get("focusExpenseId"));
  const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = expenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const defaultCategories = categories.filter((c) => c.isDefault);
  const customCategories = categories.filter((c) => !c.isDefault);

  useEffect(() => {
    if (!Number.isFinite(focusedExpenseId) || focusedExpenseId <= 0 || expenses.length === 0) {
      return;
    }

    const expenseIndex = expenses.findIndex((expense) => Number(expense.id) === focusedExpenseId);
    if (expenseIndex === -1) {
      return;
    }

    const targetPage = Math.floor(expenseIndex / ITEMS_PER_PAGE) + 1;
    setCurrentPage(targetPage);
    setHighlightedExpenseId(focusedExpenseId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("focusExpenseId");
      return next;
    }, { replace: true });

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedExpenseId(null);
    }, 2600);
  }, [expenses, focusedExpenseId, setSearchParams]);

  useEffect(() => {
    if (!highlightedExpenseId) {
      return;
    }

    const hasHighlightedOnPage = paginatedExpenses.some(
      (expense) => Number(expense.id) === Number(highlightedExpenseId)
    );
    if (!hasHighlightedOnPage) {
      return;
    }

    const rowEl = document.getElementById(`expense-row-${highlightedExpenseId}`);
    rowEl?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedExpenseId, paginatedExpenses, currentPage]);

  useEffect(() => () => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Expenses</p>
          <h2>Expense records</h2>
          <p className="page-copy">
            Add entries, update the ledger, and manage your categories in one place.
          </p>
        </div>
        <Badge variant="default">{expenses.length} entries</Badge>
      </header>

      {error ? (
        <div className="form-error">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      ) : null}

      {/* Expense form + Category manager side by side */}
      <div className="workspace-grid">
        {/* Left: expense form */}
        <Card soft>
          <CardHeader>
            <CardTitle eyebrow={editingId ? "Editing entry" : "New expense"}>
              {editingId ? "Update expense" : "Add expense"}
            </CardTitle>
            {editingId && (
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X size={14} /> Cancel
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form className="stack-form" onSubmit={handleExpenseSubmit}>
              {editingId ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    padding: "0.65rem 0.8rem",
                    borderLeft: "3px solid var(--accent)",
                    background: "rgba(23, 123, 90, 0.08)",
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    color: "var(--muted)",
                  }}
                >
                  <span>Editing expense — click Cancel to discard changes</span>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--accent-dark)",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
              <div className="field-grid">
                <label>
                  Amount
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((c) => ({ ...c, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </label>
                <label>
                  Date
                  <input
                    type="date"
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm((c) => ({ ...c, expenseDate: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <label>
                Category
                <select
                  value={expenseForm.categoryId}
                  onChange={(e) => setExpenseForm((c) => ({ ...c, categoryId: e.target.value }))}
                  required
                >
                  <option value="">Select a category</option>
                  {defaultCategories.length > 0 && (
                    <optgroup label="Default">
                      {defaultCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {customCategories.length > 0 && (
                    <optgroup label="Custom">
                      {customCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>
              <label>
                Note <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
                <textarea
                  rows="2"
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm((c) => ({ ...c, note: e.target.value }))}
                  placeholder="Brief description of the purchase"
                />
              </label>
              <Button type="submit" variant="primary">
                {editingId ? "Update expense" : "Save expense"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right: category manager — shows existing chips + add form */}
        <Card>
          <CardHeader>
            <CardTitle eyebrow="Categories">Manage categories</CardTitle>
            <Badge variant="muted">{categories.length} total</Badge>
          </CardHeader>
          <CardContent>
            <div className="stack-group">
              {/* Existing categories as chips */}
              {categories.length > 0 && (
                <div>
                  {customCategories.length > 0 ? (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Custom categories</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {customCategories.map((cat) => (
                          <span key={cat.id} className="mini-chip mini-chip--accent">{cat.name}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
                      No custom categories yet
                    </p>
                  )}
                  {defaultCategories.length > 0 ? (
                    <div style={{ marginTop: "0.75rem" }}>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setShowDefaultCategories((v) => !v)}
                        style={{ fontSize: "0.8rem", marginBottom: showDefaultCategories ? "0.5rem" : 0 }}
                      >
                        {showDefaultCategories
                          ? "Hide default categories"
                          : `Show default categories (${defaultCategories.length})`}
                      </button>
                      {showDefaultCategories ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                          {defaultCategories.map((cat) => (
                            <span
                              key={cat.id}
                              className="status-pill"
                              style={{ background: "rgba(20,33,28,0.06)", color: "var(--muted)", fontWeight: 500 }}
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Divider */}
              <div style={{ height: "1px", background: "var(--border)" }} />

              {/* Add new category */}
              <div>
                <p className="eyebrow" style={{ marginBottom: "0.65rem" }}>Add custom category</p>
                <form
                  onSubmit={handleCategorySubmit}
                  style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end" }}
                >
                  <label style={{ flex: 1, margin: 0 }}>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm((c) => ({ ...c, name: e.target.value }))}
                      placeholder="e.g. Groceries, Fuel"
                      required
                    />
                  </label>
                  <Button type="submit" variant="primary" size="sm">
                    Add category
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History card with inline filter bar */}
      <Card>
        <CardHeader>
          <CardTitle eyebrow="History">Expense history</CardTitle>
          <div className="button-row">
            {hasActiveFilter && (
              <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters}>
                <X size={13} /> Clear filter
              </Button>
            )}
            <Button
              type="button"
              variant={showFilterBar ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilterBar((v) => !v)}
            >
              {showFilterBar ? "Hide filters" : "Filter"}
            </Button>
            <span className="text-sm" style={{ color: "var(--muted)", alignSelf: "center" }}>
              {expenses.length} entries
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Inline filter bar — toggleable */}
          {showFilterBar && (
            <form
              className="field-grid field-grid--filters"
              onSubmit={handleApplyFilters}
              style={{ marginBottom: "var(--space-4)" }}
            >
              <label>
                Category
                <select
                  value={filters.categoryId}
                  onChange={(e) => setFilters((c) => ({ ...c, categoryId: e.target.value }))}
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </label>
              <label>
                From
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((c) => ({ ...c, startDate: e.target.value }))}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((c) => ({ ...c, endDate: e.target.value }))}
                />
              </label>
              <div className="align-end">
                <Button type="submit" variant="secondary" size="md">Apply</Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="loading-pulse">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <p className="empty-state">No expenses found. Add one above or adjust your filters.</p>
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
                    {paginatedExpenses.map((expense) => {
                      const isEditing = editingId === expense.id;
                      const isHighlighted = Number(highlightedExpenseId) === Number(expense.id);
                      return (
                      <tr
                        id={`expense-row-${expense.id}`}
                        key={expense.id}
                        style={
                          isHighlighted
                            ? { background: "rgba(23,123,90,0.15)" }
                            : isEditing
                              ? { background: "rgba(23,123,90,0.06)" }
                              : {}
                        }
                      >
                        <td style={{ whiteSpace: "nowrap" }}>{formatDateLabel(expense.expenseDate)}</td>
                        <td>{expense.categoryName}</td>
                        <td style={{ whiteSpace: "nowrap" }}><strong>{formatCurrency(expense.amount)}</strong></td>
                        <td style={{ color: "var(--muted)", fontSize: "0.88rem", maxWidth: "200px" }}>
                          {expense.note || "—"}
                        </td>
                        <td>
                          <div className="table-actions">
                            <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(expense)}>Edit</Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteRequest(expense)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </CardContent>
      </Card>
      <ConfirmModal
        isOpen={Boolean(confirmingDelete)}
        title="Delete expense?"
        description={
          confirmingDelete
            ? `This will permanently delete ${formatCurrency(confirmingDelete.amount)} in ${confirmingDelete.categoryName} from ${formatDateLabel(confirmingDelete.expenseDate)}.`
            : ""
        }
        confirmLabel="Delete expense"
        onCancel={() => setConfirmingDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}
