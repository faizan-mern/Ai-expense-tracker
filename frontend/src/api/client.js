const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const TOKEN_KEY = "expense_tracker_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function parseResponse(response) {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  let payload = null;

  if (isJson) {
    payload = await response.json();
  }

  if (!response.ok) {
    // Token expired or invalid — clear it and force re-login
    if (response.status === 401) {
      clearStoredToken();
      window.location.href = "/login";
      return;
    }

    if (!isJson) {
      await response.text();
      throw new Error(
        response.status >= 500
          ? "Server is waking up. Please try again in a moment."
          : "Request failed"
      );
    }
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

export async function apiRequest(path, options = {}, attempt = 0) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Server cold-start (Render free tier): first non-JSON 5xx — wait and retry once silently
  if (
    attempt === 0 &&
    response.status >= 500 &&
    !response.headers.get("content-type")?.includes("application/json")
  ) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return apiRequest(path, options, 1);
  }

  return parseResponse(response);
}