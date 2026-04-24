import { ArrowRight, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAiSettings, parseExpenseWithAi } from "../api/aiApi";
import { formatCurrency, formatDateLabel } from "../utils/formatters";

const samplePrompts = [
  "I spent 2400 on groceries today",
  "Paid 18000 rent on the first of this month",
  "Spent 650 on transport yesterday",
];

export default function AiAssistantPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [configError, setConfigError] = useState("");
  const [config, setConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadSettings() {
      try {
        const response = await fetchAiSettings();

        if (!isCancelled) {
          setConfig(response.settings || null);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setConfigError(loadError.message);
        }
      }
    }

    loadSettings();

    return () => {
      isCancelled = true;
    };
  }, []);

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
          <h2>Turn plain language into a saved expense.</h2>
          <p className="page-copy">
            Describe the amount, category, and timing naturally. The assistant parses it and saves
            the expense using your current AI settings.
          </p>
        </div>
        <Link to="/settings" className="secondary-button secondary-button--inline">
          <span className="btn-content">
            <Settings2 size={16} />
            <span>Open AI settings</span>
          </span>
        </Link>
      </header>

      <div className="workspace-grid workspace-grid--assistant">
        <section className="panel panel--soft">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Prompt</p>
              <h3>Describe an expense</h3>
            </div>
          </div>

          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Expense description
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
              <span className="btn-content">
                <span>{isSubmitting ? "Parsing with AI..." : "Create expense with AI"}</span>
                {!isSubmitting ? <ArrowRight size={16} /> : null}
              </span>
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Current setup</p>
              <h3>Active AI configuration</h3>
            </div>
          </div>

          {configError ? (
            <p className="form-error">{configError}</p>
          ) : !config ? (
            <div className="loading-pulse">Loading AI settings...</div>
          ) : (
            <div className="stack-group stack-group--compact">
              <div className="kv-grid">
                <div>
                  <span className="kv-label">Model</span>
                  <strong>{config.modelName || config.model || "Default backend model"}</strong>
                </div>
                <div>
                  <span className="kv-label">API key</span>
                  <strong>{config.apiKey ? "Configured" : "Using backend fallback or none"}</strong>
                </div>
              </div>
              <div className="prompt-preview">
                <span className="kv-label">System prompt</span>
                <p>{config.systemPrompt || "No custom instructions saved."}</p>
              </div>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Result</p>
              <h3>Saved expense preview</h3>
            </div>
          </div>

          {!result ? (
            <p className="empty-state">
              Submit a sentence and the parsed expense plus saved record will appear here.
            </p>
          ) : (
            <div className="stack-group">
              <div>
                <p className="eyebrow">Parsed expense</p>
                <pre>{JSON.stringify(result.parsedExpense, null, 2)}</pre>
              </div>
              <ul className="data-list">
                <li>
                  <div>
                    <strong>Category</strong>
                    <span>{result.expense.categoryName}</span>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Amount</strong>
                    <span>{formatCurrency(result.expense.amount)}</span>
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
                    <span>{result.expense.note || "No note saved"}</span>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
