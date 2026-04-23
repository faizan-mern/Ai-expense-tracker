import { useState } from "react";
import { parseExpenseWithAi } from "../api/aiApi";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function AiAssistantPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setIsSubmitting(true);

    try {
      const response = await parseExpenseWithAi({ text });
      setResult(response);
      setText("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI Assistant</p>
          <h2>Turn natural language into a saved expense without leaving the app.</h2>
        </div>
      </header>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>Describe an expense</h3>
          </div>
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Example
              <textarea
                rows="5"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="I spent 500 on food today"
                required
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Parsing..." : "Create expense with AI"}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>Result</h3>
          </div>
          {!result ? (
            <p>Submit a sentence and the saved expense details will appear here.</p>
          ) : (
            <div className="result-stack">
              <div>
                <p className="eyebrow">Parsed expense</p>
                <pre>{JSON.stringify(result.parsedExpense, null, 2)}</pre>
              </div>
              <div>
                <p className="eyebrow">Saved expense</p>
                <ul className="compact-list plain">
                  <li>
                    <strong>Category</strong>
                    <span>{result.expense.categoryName}</span>
                  </li>
                  <li>
                    <strong>Amount</strong>
                    <span>{formatCurrency(result.expense.amount)}</span>
                  </li>
                  <li>
                    <strong>Date</strong>
                    <span>{result.expense.expenseDate}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
