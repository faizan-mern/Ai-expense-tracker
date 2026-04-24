const { ChatOpenAI } = require("@langchain/openai");
const { z } = require("zod");
const pool = require("../../db");
const { listAccessibleCategories } = require("../categoryService");

const expenseExtractionSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.number().int().positive(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().nullable(),
});

function getTodayDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function getAiConfig(userId) {
  const result = await pool.query(
    "SELECT api_key, model_name, system_prompt FROM ai_settings WHERE user_id = $1",
    [userId]
  );
  
  const row = result.rows[0] || {};
  const apiKey = row.api_key || process.env.AI_API_KEY;
  const model = row.model_name || process.env.AI_MODEL || "openai/gpt-4o-mini";
  const systemPrompt = row.system_prompt || "";
  const baseURL = process.env.AI_BASE_URL || "https://openrouter.ai/api/v1";

  if (!apiKey) {
    const error = new Error(
      "AI is not configured. Please add your API key in the AI Assistant configuration."
    );
    error.statusCode = 403;
    throw error;
  }

  return { apiKey, model, baseURL, systemPrompt };
}

function buildCategoryPrompt(categories) {
  return categories.map((category) => `${category.id}: ${category.name}`).join("\n");
}

async function parseExpenseTextWithAi({ userId, text }) {
  const { apiKey, model, baseURL, systemPrompt } = await getAiConfig(userId);
  const categories = await listAccessibleCategories(userId);

  if (categories.length === 0) {
    const error = new Error("No categories are available for this user");
    error.statusCode = 400;
    throw error;
  }

  const llm = new ChatOpenAI({
    apiKey,
    model,
    temperature: 0,
    maxRetries: 2,
    configuration: baseURL ? { baseURL } : undefined,
  }).withStructuredOutput(expenseExtractionSchema, {
    name: "expense_extraction",
  });

  const promptParts =[
    "You extract a single expense from user text.",
    `Today's date is ${getTodayDateString()}.`,
    "Return one expense using the schema fields only.",
    "Choose categoryId only from this allowed list:",
    buildCategoryPrompt(categories),
    "Rules:",
    "- amount must be a positive number",
    "- expenseDate must be YYYY-MM-DD",
    "- note should be null when there is no useful note",
    '- if the text says "today", use today\'s date',
    '- if the text says "yesterday", use the previous calendar date',
  ];

  if (systemPrompt && systemPrompt.trim()) {
    promptParts.push("");
    promptParts.push("User custom instructions:");
    promptParts.push(systemPrompt.trim());
    promptParts.push("");
  }

  promptParts.push("User text:");
  promptParts.push(text);

  const prompt = promptParts.join("\n");

  return llm.invoke(prompt);
}

module.exports = {
  parseExpenseTextWithAi,
};