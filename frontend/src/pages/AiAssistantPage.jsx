import { AlertCircle, ArrowRight, Loader2, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAiSettings, parseExpenseWithAi } from "../api/aiApi";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
import { formatCurrency, formatDateLabel } from "../utils/formatters";

function formatModelLabel(modelId) {
  if (!modelId) return modelId;
  const slashIdx = modelId.indexOf("/");
  if (slashIdx === -1) return modelId;
  const provider = modelId.slice(0, slashIdx);
  const model = modelId.slice(slashIdx + 1);
  return `${model}  (${provider.charAt(0).toUpperCase() + provider.slice(1)})`;
}

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
  const [configError, setConfigError] = useState("");
  const [config, setConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadSettings() {
      try {
        const response = await fetchAiSettings();
        if (!isCancelled) setConfig(response.settings || null);
      } catch (loadError) {
        if (!isCancelled) setConfigError(loadError.message);
      }
    }

    loadSettings();
    return () => { isCancelled = true; };
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
      showToast("Expense created via AI", "success");
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
            Describe an expense naturally — the assistant extracts the amount, category, and date, then saves it.
          </p>
        </div>
        <Link to="/settings">
          <Button variant="secondary" type="button">
            <Settings2 size={15} />
            AI Settings
          </Button>
        </Link>
      </header>

      <div className="workspace-grid workspace-grid--assistant">
        {/* Left: prompt form */}
        <Card soft>
          <CardHeader>
            <CardTitle eyebrow="Prompt">Describe an expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="stack-form" onSubmit={handleSubmit}>
              <textarea
                rows="4"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="I spent 500 on food today"
                required
              />

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

              {error ? (
                <div className="form-error">
                  <AlertCircle size={18} />
                  <p>{error}</p>
                </div>
              ) : null}

              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 size={15} className="spin" />
                ) : (
                  <ArrowRight size={15} />
                )}
                {isSubmitting ? "Parsing with AI..." : "Create expense with AI"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right column: config + result — flex column so result fills remaining height */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Active AI configuration */}
          <Card>
            <CardHeader>
              <CardTitle eyebrow="Current setup">Active AI configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {configError ? (
                <div className="form-error">
                  <AlertCircle size={18} />
                  <p>{configError}</p>
                </div>
              ) : !config ? (
                <div className="loading-pulse">Loading AI settings...</div>
              ) : (
                <div className="stack-group stack-group--compact">
                  <div className="kv-grid">
                    <div>
                      <span className="kv-label">Model</span>
                      <strong>
                        {formatModelLabel(config.modelName || config.model) || "Default backend model"}
                      </strong>
                    </div>
                    <div>
                      <span className="kv-label">API key</span>
                      <strong>{config.apiKey ? "Configured" : "Using backend fallback"}</strong>
                    </div>
                  </div>
                  <div className="prompt-preview">
                    <span className="kv-label">System prompt</span>
                    <p>{config.systemPrompt || "No custom instructions saved."}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result — grows to fill remaining column height */}
          <Card style={{ flex: 1 }}>
            <CardHeader>
              <CardTitle eyebrow="Created expense">Result</CardTitle>
            </CardHeader>
            <CardContent>
              {!result ? (
                <p className="empty-state">
                  Submit a description and the saved expense will appear here.
                </p>
              ) : (
                <ul className="data-list">
                  <li>
                    <div>
                      <span className="kv-label">Amount</span>
                      <strong>{formatCurrency(result.expense.amount)}</strong>
                    </div>
                  </li>
                  <li>
                    <div>
                      <span className="kv-label">Category</span>
                      <strong>{result.expense.categoryName}</strong>
                    </div>
                  </li>
                  <li>
                    <div>
                      <span className="kv-label">Date</span>
                      <strong>{formatDateLabel(result.expense.expenseDate)}</strong>
                    </div>
                  </li>
                  <li>
                    <div>
                      <span className="kv-label">Note</span>
                      <strong>{result.expense.note || "—"}</strong>
                    </div>
                  </li>
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
