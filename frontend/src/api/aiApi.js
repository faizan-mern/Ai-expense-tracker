import { apiRequest } from "./client";

export function parseExpenseWithAi(payload) {
  return apiRequest("/api/ai/parse-expense", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchAiSettings() {
  return apiRequest("/api/ai/settings");
}

export function saveAiSettings(payload) {
  return apiRequest("/api/ai/settings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchAvailableModels() {
  return apiRequest("/api/ai/models");
}