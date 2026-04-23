import { apiRequest } from "./client";

export function fetchBudgets(budgetMonth = "") {
  const suffix = budgetMonth ? `?budgetMonth=${budgetMonth}` : "";
  return apiRequest(`/api/budgets${suffix}`);
}

export function saveBudget(payload) {
  return apiRequest("/api/budgets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteBudget(budgetId) {
  return apiRequest(`/api/budgets/${budgetId}`, {
    method: "DELETE",
  });
}
