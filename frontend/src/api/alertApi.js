import { apiRequest } from "./client";

export function fetchAlerts(unreadOnly = false) {
  const suffix = unreadOnly ? "?unreadOnly=true" : "";
  return apiRequest(`/api/alerts${suffix}`);
}

export function markAlertAsRead(alertId) {
  return apiRequest(`/api/alerts/${alertId}/read`, {
    method: "PATCH",
  });
}
