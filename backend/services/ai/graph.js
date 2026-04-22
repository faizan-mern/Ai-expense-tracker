const { Annotation, END, START, StateGraph } = require("@langchain/langgraph");
const { parseExpenseTextWithAi } = require("./agent");
const { createExpenseTool } = require("./tools/createExpense");

const AiExpenseState = Annotation.Root({
  userId: Annotation(),
  text: Annotation(),
  parsedExpense: Annotation(),
  expense: Annotation(),
});

async function parseExpenseNode(state) {
  const parsedExpense = await parseExpenseTextWithAi({
    userId: state.userId,
    text: state.text,
  });

  return { parsedExpense };
}

async function createExpenseNode(state) {
  const expense = await createExpenseTool({
    userId: state.userId,
    parsedExpense: state.parsedExpense,
  });

  return { expense };
}

const aiExpenseGraph = new StateGraph(AiExpenseState)
  .addNode("parse_expense", parseExpenseNode)
  .addNode("create_expense", createExpenseNode)
  .addEdge(START, "parse_expense")
  .addEdge("parse_expense", "create_expense")
  .addEdge("create_expense", END)
  .compile();

async function runAiExpenseGraph({ userId, text }) {
  return aiExpenseGraph.invoke({
    userId,
    text,
  });
}

module.exports = {
  runAiExpenseGraph,
};
