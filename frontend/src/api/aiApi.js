import { apiRequest } from "./client";

export function parseExpenseWithAi(payload) {
  return apiRequest("/api/ai/parse-expense", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
