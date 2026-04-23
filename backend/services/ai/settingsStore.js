const DEFAULT_SYSTEM_PROMPT =
  "You extract expense data from user text. Return amount, categoryId, expenseDate, and note.";

const FALLBACK_MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3-haiku",
  "google/gemini-flash-1.5",
];

const settingsByUserId = new Map();

function normalizeStoredValue(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const nextValue = String(value).trim();
  return nextValue ? nextValue : "";
}

function maskApiKey(apiKey) {
  return apiKey ? "••••••••" : "";
}

function isMaskedApiKey(value) {
  return typeof value === "string" && /^[•*]+$/.test(value.trim());
}

function getAiSettingsForUser(userId) {
  return settingsByUserId.get(String(userId)) || null;
}

function saveAiSettingsForUser(userId, payload = {}) {
  const key = String(userId);
  const currentSettings = getAiSettingsForUser(key) || {};
  const nextApiKeyValue = normalizeStoredValue(payload.apiKey);
  const nextSettings = {
    apiKey:
      nextApiKeyValue === undefined
        ? currentSettings.apiKey || ""
        : isMaskedApiKey(nextApiKeyValue) && currentSettings.apiKey
          ? currentSettings.apiKey
          : nextApiKeyValue,
    model:
      normalizeStoredValue(payload.model) === undefined
        ? currentSettings.model || ""
        : normalizeStoredValue(payload.model),
    baseURL:
      normalizeStoredValue(payload.baseURL) === undefined
        ? currentSettings.baseURL || ""
        : normalizeStoredValue(payload.baseURL),
    systemPrompt:
      normalizeStoredValue(payload.systemPrompt) === undefined
        ? currentSettings.systemPrompt || DEFAULT_SYSTEM_PROMPT
        : normalizeStoredValue(payload.systemPrompt) || DEFAULT_SYSTEM_PROMPT,
  };

  settingsByUserId.set(key, nextSettings);
  return nextSettings;
}

function getSerializableAiSettings(userId) {
  const storedSettings = getAiSettingsForUser(userId);

  return {
    apiKey: maskApiKey(storedSettings?.apiKey),
    model: storedSettings?.model || process.env.AI_MODEL || "",
    baseURL: storedSettings?.baseURL || process.env.AI_BASE_URL || "",
    systemPrompt: storedSettings?.systemPrompt || DEFAULT_SYSTEM_PROMPT,
  };
}

module.exports = {
  DEFAULT_SYSTEM_PROMPT,
  FALLBACK_MODELS,
  getAiSettingsForUser,
  getSerializableAiSettings,
  saveAiSettingsForUser,
};
