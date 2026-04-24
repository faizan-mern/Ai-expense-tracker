const { runAiExpenseGraph } = require("../services/ai/graph");

function unwrapAiError(error) {
  if (!error) {
    return null;
  }

  if (error.statusCode || error.message) {
    return error;
  }

  if (Array.isArray(error.errors)) {
    for (const nestedError of error.errors) {
      const unwrapped = unwrapAiError(nestedError);

      if (unwrapped) {
        return unwrapped;
      }
    }
  }

  if (error.cause) {
    return unwrapAiError(error.cause);
  }

  return error;
}

async function parseExpense(req, res) {
  const { text } = req.body || {};
  const userId = req.user.userId;

  if (!text || !String(text).trim()) {
    return res.status(400).json({
      success: false,
      message: "text is required",
    });
  }

  try {
    const result = await runAiExpenseGraph({
      userId,
      text: String(text).trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Expense created from AI input",
      parsedExpense: result.parsedExpense,
      expense: result.expense,
    });
  } catch (error) {
    const resolvedError = unwrapAiError(error) || error;

    if (resolvedError.statusCode) {
      return res.status(resolvedError.statusCode).json({
        success: false,
        message: resolvedError.message,
      });
    }

    const errorMsg = (resolvedError.message || "").toLowerCase();
    const isCompatibilityError =
      errorMsg.includes("tool") ||
      errorMsg.includes("function call") ||
      errorMsg.includes("not support") ||
      errorMsg.includes("unsupported");

    return res.status(500).json({
      success: false,
      message: isCompatibilityError
        ? "This model does not support AI parsing. Go to AI Settings and select a different model."
        : "Failed to process AI expense request",
      error: resolvedError.message || "Unknown AI error",
    });
  }
}

module.exports = {
  parseExpense,
};
