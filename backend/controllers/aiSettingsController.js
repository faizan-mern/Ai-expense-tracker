const pool = require("../db");

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_BASE_URL = process.env.AI_BASE_URL || "https://openrouter.ai/api/v1";
const MASKED_API_KEY = "********";
const FALLBACK_MODELS = [
  DEFAULT_MODEL,
  "anthropic/claude-3.5-sonnet",
  "google/gemini-1.5-flash",
];

function normalizeBaseUrl(baseURL) {
  return String(baseURL || "").trim().replace(/\/+$/, "");
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return String(value).trim();
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

function serializeSettings(row = {}) {
  const modelName = row.model_name || DEFAULT_MODEL;

  return {
    apiKey: row.api_key ? MASKED_API_KEY : "",
    modelName,
    model: modelName,
    systemPrompt: row.system_prompt || "",
    baseURL: DEFAULT_BASE_URL,
  };
}

async function getAiSettings(req, res) {
  try {
    const result = await pool.query(
      `SELECT api_key, model_name, system_prompt
       FROM ai_settings
       WHERE user_id = $1`,
      [req.user.userId]
    );

    return res.json({
      success: true,
      settings: serializeSettings(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch AI settings",
      error: error.message,
    });
  }
}

async function saveAiSettings(req, res) {
  const { apiKey, modelName, model, systemPrompt } = req.body || {};
  const normalizedApiKey = normalizeOptionalString(apiKey);
  const normalizedModelName = normalizeOptionalString(modelName || model) || DEFAULT_MODEL;
  const normalizedSystemPrompt =
    typeof systemPrompt === "string" ? systemPrompt.trim() : null;

  try {
    let actualApiKey = normalizedApiKey;

    if (normalizedApiKey === null || normalizedApiKey === MASKED_API_KEY) {
      actualApiKey = null;
    }

    const result = await pool.query(
      `INSERT INTO ai_settings (user_id, api_key, model_name, system_prompt, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         api_key = CASE
           WHEN $2 IS NULL THEN ai_settings.api_key
           ELSE $2
         END,
         model_name = COALESCE($3, ai_settings.model_name),
         system_prompt = CASE
           WHEN $4 IS NULL THEN ai_settings.system_prompt
           ELSE $4
         END,
         updated_at = NOW()
       RETURNING api_key, model_name, system_prompt`,
      [
        req.user.userId,
        actualApiKey,
        normalizedModelName,
        normalizedSystemPrompt,
      ]
    );

    return res.json({
      success: true,
      message: "AI settings saved",
      settings: serializeSettings(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save AI settings",
      error: error.message,
    });
  }
}

async function getAvailableModels(req, res) {
  try {
    const result = await pool.query(
      `SELECT api_key
       FROM ai_settings
       WHERE user_id = $1`,
      [req.user.userId]
    );

    const apiKey = result.rows[0]?.api_key || process.env.AI_API_KEY || "";
    const endpoint = buildModelsEndpoint(DEFAULT_BASE_URL);

    if (!apiKey) {
      return res.json({
        success: true,
        models: FALLBACK_MODELS,
      });
    }

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
          .map((entry) => entry?.id)
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
