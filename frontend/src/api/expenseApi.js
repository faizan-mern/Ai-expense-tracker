import { apiRequest } from "./client";

export function fetchExpenses(queryParams = {}) {
  const params = new URLSearchParams();

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/api/expenses${suffix}`);
}

export function createExpense(payload) {
  return apiRequest("/api/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateExpense(expenseId, payload) {
  return apiRequest(`/api/expenses/${expenseId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteExpense(expenseId) {
  return apiRequest(`/api/expenses/${expenseId}`, {
    method: "DELETE",
  });
}
