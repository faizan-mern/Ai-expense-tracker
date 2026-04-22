const { ChatOpenAI } = require("@langchain/openai");
const { z } = require("zod");
const { listAccessibleCategories } = require("../categoryService");

const expenseExtractionSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.number().int().positive(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().nullable(),
});

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getAiConfig() {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  const baseURL = process.env.AI_BASE_URL;

  if (!apiKey || !model) {
    const error = new Error(
      "AI is not configured yet. Add AI_API_KEY and AI_MODEL in backend/.env before using the AI endpoint."
    );
    error.statusCode = 503;
    throw error;
  }

  return {
    apiKey,
    model,
    baseURL: baseURL || undefined,
  };
}

function buildCategoryPrompt(categories) {
  return categories.map((category) => `${category.id}: ${category.name}`).join("\n");
}

async function parseExpenseTextWithAi({ userId, text }) {
  const { apiKey, model, baseURL } = getAiConfig();
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

  const prompt = [
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
    "User text:",
    text,
  ].join("\n");

  return llm.invoke(prompt);
}

module.exports = {
  parseExpenseTextWithAi,
};
