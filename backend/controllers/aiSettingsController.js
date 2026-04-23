const {
  FALLBACK_MODELS,
  getAiSettingsForUser,
  getSerializableAiSettings,
  saveAiSettingsForUser,
} = require("../services/ai/settingsStore");

function normalizeBaseUrl(baseURL) {
  return String(baseURL || "").trim().replace(/\/+$/, "");
}

function buildModelsEndpoint(baseURL) {
  const normalizedBaseURL = normalizeBaseUrl(baseURL);

  if (!normalizedBaseURL) {
    return "";
  }

  return normalizedBaseURL.endsWith("/v1")
    ? `${normalizedBaseURL}/models`
    : `${normalizedBaseURL}/v1/models`;
}

async function getAiSettings(req, res) {
  return res.json({
    success: true,
    settings: getSerializableAiSettings(req.user.userId),
  });
}

async function saveAiSettings(req, res) {
  const settings = saveAiSettingsForUser(req.user.userId, req.body || {});

  return res.json({
    success: true,
    message: "AI settings saved",
    settings: {
      ...settings,
      apiKey: settings.apiKey ? "••••••••" : "",
    },
  });
}

async function getAvailableModels(req, res) {
  const storedSettings = getAiSettingsForUser(req.user.userId);
  const apiKey = storedSettings?.apiKey || process.env.AI_API_KEY || "";
  const baseURL = storedSettings?.baseURL || process.env.AI_BASE_URL || "https://openrouter.ai/api/v1";
  const endpoint = buildModelsEndpoint(baseURL);

  if (!apiKey) {
    return res.json({
      success: true,
      models: FALLBACK_MODELS,
    });
  }

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Model request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const models = Array.isArray(payload?.data)
      ? payload.data
          .map((model) => model?.id)
          .filter(Boolean)
          .sort((left, right) => left.localeCompare(right))
      : [];

    return res.json({
      success: true,
      models: models.length > 0 ? models : FALLBACK_MODELS,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "Failed to fetch available models",
      error: error.message,
    });
  }
}

module.exports = {
  getAiSettings,
  saveAiSettings,
  getAvailableModels,
};
