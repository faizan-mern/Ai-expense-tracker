import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { parseExpenseWithAi } from "../api/aiApi";
import { useToast } from "../components/ui/Toast";
import { formatCurrency, formatDateLabel } from "../utils/formatters";

const samplePrompts = [
  "I spent 2400 on groceries today",
  "Paid 18000 rent on the first of this month",
  "Spent 650 on transport yesterday",
];

export default function AiAssistantPage() {
  const { showToast } = useToast();
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
      showToast("Expense created with AI", "success");
    } catch (submitError) {
      setError(submitError.message);
      showToast(submitError.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI Assistant</p>
          <h2>Turn plain language into a saved expense.</h2>
          <p className="page-copy">
            Describe the amount, category, and time naturally. The backend will parse and save it for you.
          </p>
        </div>
      </header>

      <div className="workspace-grid">
        <section className="panel panel--soft">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Prompt</p>
              <h3>Describe an expense</h3>
            </div>
          </div>
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Your expense description
              <textarea
                rows="6"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="I spent 500 on food today"
                required
              />
            </label>
            <div className="sample-prompt-row">
              {samplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="chip-button"
                  onClick={() => setText(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Parsing..." : "Create expense with AI"}
            </button>
          </form>
        </section>

        <section className={`panel${result ? " result-card" : ""}`}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Result</p>
              <h3>Saved expense preview</h3>
            </div>
          </div>
          {isSubmitting ? (
            <p className="empty-state">Analyzing your expense with AI...</p>
          ) : !result ? (
            <p className="empty-state">
              Submit a sentence and the structured result will appear here.
            </p>
          ) : (
            <div className="stack-group">
              <div>
                <div className="button-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
                    <CheckCircle2 size={20} color="#16825d" />
                    <div>
                      <strong>Expense saved successfully</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setResult(null)}
                  >
                    Parse another expense
                  </button>
                </div>
              </div>
              <ul className="data-list">
                <li>
                  <div>
                    <strong>Amount</strong>
                    <span>{formatCurrency(result.expense.amount)}</span>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Category</strong>
                    <span>{result.expense.categoryName}</span>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Date</strong>
                    <span>{formatDateLabel(result.expense.expenseDate)}</span>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Note</strong>
                    <span>{result.expense.note || "—"}</span>
                  </div>
                </li>
              </ul>
              <p className="empty-state">This expense has been added to your records.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
