const pool = require("../db");

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_BASE_URL = process.env.AI_BASE_URL || "https://openrouter.ai/api/v1";
const MASKED_API_KEY = "********";
// Confirmed working models with OpenRouter + LangChain structured output
const AVAILABLE_MODELS = [
  "openai/gpt-4o-mini",
  "anthropic/claude-3.5-haiku",
  "inclusionai/ling-2.6-1t:free",
  "inclusionai/ling-2.6-flash:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
];

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return String(value).trim();
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

    if (
      normalizedApiKey === null ||
      normalizedApiKey === "" ||
      normalizedApiKey === MASKED_API_KEY
    ) {
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
    });
  }
}

function getAvailableModels(req, res) {
  return res.json({
    success: true,
    models: AVAILABLE_MODELS,
  });
}

module.exports = {
  getAiSettings,
  saveAiSettings,
  getAvailableModels,
};
