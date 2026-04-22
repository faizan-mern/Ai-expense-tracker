const { createExpenseForUser } = require("../../expenseService");

async function createExpenseTool({ userId, parsedExpense }) {
  return createExpenseForUser({
    userId,
    amount: parsedExpense.amount,
    categoryId: parsedExpense.categoryId,
    expenseDate: parsedExpense.expenseDate,
    note: parsedExpense.note,
  });
}

module.exports = {
  createExpenseTool,
};
