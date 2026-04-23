import { apiRequest } from "./client";

export function fetchCategories() {
  return apiRequest("/api/categories");
}

export function createCategory(payload) {
  return apiRequest("/api/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
