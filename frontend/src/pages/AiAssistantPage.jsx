import { AlertCircle, ArrowRight, Loader2, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { parseExpenseWithAi } from "../api/aiApi";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
import { formatCurrency, formatDateLabel } from "../utils/formatters";

const samplePrompts = [
  "I spent 850 on biryani today",
  "Paid 450 for Uber yesterday",
  "3200 on groceries this week",
];

export default function AiAssistantPage() {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState([]);
  const scrollAnchorRef = useRef(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLastUserMessage(String(text || "").trim());
    setMessages((prev) => [...prev, { type: "user", text: String(text || "").trim() }]);
    setIsSubmitting(true);

    try {
      const response = await parseExpenseWithAi({ text });
      setResult(response);
      setMessages((prev) => [...prev, { type: "result", expense: response.expense }]);
      setText("");
      showToast("Expense created via AI", "success");
    } catch (submitError) {
      setError(submitError.message);
      setMessages((prev) => [...prev, { type: "error", text: submitError.message }]);
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

      <Card>
        <CardHeader>
          <CardTitle eyebrow="Assistant">AI expense parser</CardTitle>
          {messages.length > 0 && (
            <button
              type="button"
              className="text-button"
              onClick={() => { setMessages([]); setResult(null); setError(""); setLastUserMessage(""); }}
              style={{ fontSize: "0.8rem" }}
            >
              Clear
            </button>
          )}
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          <form onSubmit={handleSubmit}>
            <div
              className="ai-chat-scroll"
              style={{
                height: 320,
                overflowY: "auto",
                padding: "0.75rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              {messages.length === 0 && !isSubmitting && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ margin: 0, color: "var(--muted)", textAlign: "center", fontSize: "0.9rem" }}>
                    Describe a purchase in plain language to create an expense entry.
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => {
                if (msg.type === "user") return (
                  <div key={idx} style={{ justifySelf: "end", alignSelf: "flex-end", maxWidth: "88%", background: "rgba(23,123,90,0.12)", color: "var(--text)", borderRadius: "14px 14px 4px 14px", padding: "0.6rem 0.8rem", fontSize: "0.9rem" }}>
                    {msg.text}
                  </div>
                );
                if (msg.type === "result") return (
                  <div key={idx} style={{ alignSelf: "flex-start", maxWidth: "88%", borderRadius: "4px 14px 14px 14px", border: "1px solid var(--border)", background: "var(--surface-strong)", padding: "0.75rem 0.85rem" }}>
                    <div className="kv-grid">
                      <div><span className="kv-label">Amount</span><strong>{formatCurrency(msg.expense.amount)}</strong></div>
                      <div><span className="kv-label">Category</span><strong>{msg.expense.categoryName}</strong></div>
                      <div><span className="kv-label">Date</span><strong>{formatDateLabel(msg.expense.expenseDate)}</strong></div>
                      <div><span className="kv-label">Note</span><strong>{msg.expense.note || "None"}</strong></div>
                    </div>
                    {msg.expense?.id && (
                      <div style={{ marginTop: "0.65rem" }}>
                        <Link to={`/expenses?focusExpenseId=${msg.expense.id}`} style={{ color: "var(--accent-dark)", fontSize: "0.84rem", fontWeight: 700 }}>View expense &rarr;</Link>
                      </div>
                    )}
                  </div>
                );
                if (msg.type === "error") return (
                  <div key={idx} style={{ alignSelf: "flex-start", maxWidth: "88%", borderLeft: "3px solid var(--danger)", background: "rgba(185,80,59,0.07)", borderRadius: "0 12px 12px 0", padding: "0.65rem 0.8rem", fontSize: "0.88rem", color: "var(--text)" }}>
                    {msg.text}
                  </div>
                );
                return null;
              })}

              {isSubmitting && (
                <>
                  <div className="ai-thinking-bubble">
                    <span className="ai-thinking-dot" style={{ animationDelay: "0ms" }} />
                    <span className="ai-thinking-dot" style={{ animationDelay: "150ms" }} />
                    <span className="ai-thinking-dot" style={{ animationDelay: "300ms" }} />
                  </div>
                </>
              )}

              <div ref={scrollAnchorRef} />
            </div>

            <div style={{ borderTop: "1px solid var(--border)", padding: "0.6rem 0.75rem 0" }}>
              <div className="sample-prompt-row">
                {samplePrompts.map((prompt) => (
                  <button key={prompt} type="button" className="chip-button" onClick={() => setText(prompt)} disabled={isSubmitting}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 0.75rem 0.75rem", alignItems: "center" }}>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="I spent 500 on food today"
                required
                disabled={isSubmitting}
                style={{ flex: 1 }}
              />
              <Button type="submit" variant="primary" disabled={isSubmitting} style={{ width: 110, justifyContent: "center" }}>
                {isSubmitting ? <Loader2 size={15} className="spin" /> : <ArrowRight size={15} />}
                {isSubmitting ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
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
