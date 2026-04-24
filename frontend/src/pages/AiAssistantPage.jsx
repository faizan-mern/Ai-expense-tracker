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
  return `${model} (${provider.charAt(0).toUpperCase() + provider.slice(1)})`;
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
  const [lastUserMessage, setLastUserMessage] = useState("");
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
    setLastUserMessage(String(text || "").trim());
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
          <h2>Create an expense from a message</h2>
          <p className="page-copy">
            Describe a purchase in plain language and save it as a structured
            expense entry.
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
        <Card soft>
          <CardHeader>
            <CardTitle eyebrow="Input">Describe an expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="stack-form" onSubmit={handleSubmit}>
              <textarea
                rows="5"
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
                {isSubmitting ? "Creating expense..." : "Create expense"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="detail-column">
          <Card>
            <CardHeader>
              <CardTitle eyebrow="Parser status">Current setup</CardTitle>
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
                        {formatModelLabel(config.modelName || config.model) ||
                          "Default backend model"}
                      </strong>
                    </div>
                    <div>
                      <span className="kv-label">API key</span>
                      <strong>
                        {config.apiKey ? "Configured" : "Using backend default"}
                      </strong>
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

          <Card>
            <CardHeader>
              <CardTitle eyebrow="Saved entry">Result</CardTitle>
            </CardHeader>
            <CardContent>
              {isSubmitting && lastUserMessage ? (
                <div className="stack-group stack-group--compact">
                  <div
                    style={{
                      justifySelf: "end",
                      maxWidth: "90%",
                      background: "rgba(23, 123, 90, 0.12)",
                      color: "var(--text)",
                      borderRadius: "12px",
                      padding: "0.6rem 0.75rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    {lastUserMessage}
                  </div>
                  <div className="ai-thinking-bubble">
                    <span
                      className="ai-thinking-dot"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="ai-thinking-dot"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="ai-thinking-dot"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              ) : !result ? (
                <p className="empty-state">
                  The saved expense will appear here after submission.
                </p>
              ) : (
                <>
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
                      <strong>{result.expense.note || "None"}</strong>
                    </div>
                  </li>
                </ul>
                {result.expense?.id ? (
                  <div style={{ marginTop: "0.8rem" }}>
                    <Link
                      to="/expenses"
                      style={{
                        color: "var(--accent-dark)",
                        fontSize: "0.86rem",
                        fontWeight: 700,
                      }}
                    >
                      View expense &rarr;
                    </Link>
                  </div>
                ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <style>{`
        .ai-thinking-bubble {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          width: fit-content;
          padding: 0.55rem 0.75rem;
          border-radius: 12px;
          background: rgba(20, 33, 28, 0.06);
        }

        .ai-thinking-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: var(--muted);
          animation: ai-thinking-pulse 1s ease-in-out infinite;
        }

        @keyframes ai-thinking-pulse {
          0%,
          100% {
            opacity: 0.2;
            transform: translateY(0);
          }

          50% {
            opacity: 1;
            transform: translateY(-1px);
          }
        }
      `}</style>
    </section>
  );
}
