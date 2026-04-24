import { AlertCircle, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAiSettings, saveAiSettings } from "../api/aiApi";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";

const DEFAULT_MODEL = "openai/gpt-4o-mini";

// Confirmed working models with OpenRouter + LangChain structured output
const AVAILABLE_MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-3.5-sonnet",
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.5-flash-preview:free",
  "deepseek/deepseek-chat:free",
  "mistralai/mistral-small",
  "nvidia/llama-3.1-nemotron-70b-instruct:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",
];

function parseModelId(modelId) {
  const slashIdx = modelId.indexOf("/");
  if (slashIdx === -1) return { model: modelId, providerLabel: "" };
  const provider = modelId.slice(0, slashIdx);
  return {
    model: modelId.slice(slashIdx + 1),
    providerLabel: provider.charAt(0).toUpperCase() + provider.slice(1),
  };
}

function formatModelLabel(modelId) {
  if (!modelId) return modelId;
  const { model, providerLabel } = parseModelId(modelId);
  if (!providerLabel) return model;
  return `${model}  —  ${providerLabel}`;
}

const initialSettings = {
  apiKey: "",
  modelName: DEFAULT_MODEL,
  systemPrompt: "",
  baseURL: "",
};

export default function AiSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(initialSettings);
  const [modelSearch, setModelSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadSettings() {
      try {
        const response = await fetchAiSettings();
        if (!isCancelled) {
          setSettings({
            apiKey: response.settings.apiKey || "",
            modelName: response.settings.modelName || response.settings.model || DEFAULT_MODEL,
            systemPrompt: response.settings.systemPrompt || "",
            baseURL: response.settings.baseURL || "",
          });
          setIsLoading(false);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.message);
          setIsLoading(false);
          showToast(loadError.message, "error");
        }
      }
    }

    loadSettings();
    return () => { isCancelled = true; };
  }, [showToast]);

  async function handleSaveSettings(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await saveAiSettings({
        apiKey: settings.apiKey,
        modelName: settings.modelName,
        systemPrompt: settings.systemPrompt,
      });

      setSettings((current) => ({
        ...current,
        apiKey: response.settings.apiKey || "",
        modelName: response.settings.modelName || response.settings.model || current.modelName,
        systemPrompt: response.settings.systemPrompt || "",
        baseURL: response.settings.baseURL || current.baseURL,
      }));
      showToast("AI settings saved", "success");
    } catch (saveError) {
      setError(saveError.message);
      showToast(saveError.message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  const filteredModels = AVAILABLE_MODELS.filter((m) =>
    m.toLowerCase().includes(modelSearch.toLowerCase())
  );

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI Settings</p>
          <h2>Configure your AI model and credentials.</h2>
          <p className="page-copy">
            Set your provider key, pick a model, and tune the system prompt.
          </p>
        </div>
        <Badge variant="default">{formatModelLabel(settings.modelName || DEFAULT_MODEL)}</Badge>
      </header>

      <Card soft>
        <CardHeader>
          <CardTitle eyebrow="Provider">Current connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="stack-group stack-group--compact">
            <p className="empty-state">
              Your key and model override the backend defaults for this account.
            </p>
            <div className="kv-grid">
              <div>
                <span className="kv-label">Base URL</span>
                <strong>{settings.baseURL || "Backend default"}</strong>
              </div>
              <div>
                <span className="kv-label">Saved key</span>
                <strong>{settings.apiKey ? "Configured" : "Using backend fallback or none"}</strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="form-error">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      ) : null}

      {isLoading ? (
        <section className="panel">
          <div className="loading-pulse">Loading AI settings...</div>
        </section>
      ) : (
        <form className="stack-group" onSubmit={handleSaveSettings}>
          <Card soft>
            <CardHeader>
              <CardTitle eyebrow="Credentials">Provider access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stack-form">
                <label>
                  API key
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, apiKey: event.target.value }))
                    }
                    placeholder="sk-or-v1-..."
                  />
                </label>
                <p className="field-note">
                  Leave unchanged to keep the existing key.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle eyebrow="Model">Choose the parser model</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSettings((current) => ({ ...current, modelName: DEFAULT_MODEL }));
                  setModelSearch("");
                }}
              >
                Reset to default
              </Button>
            </CardHeader>
            <CardContent>
              <div className="stack-form">
                <label>
                  Search
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(event) => setModelSearch(event.target.value)}
                    placeholder="Filter models..."
                  />
                </label>

                {filteredModels.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {filteredModels.map((modelName) => {
                      const isSelected = settings.modelName === modelName;
                      const { model, providerLabel } = parseModelId(modelName);
                      return (
                        <button
                          key={modelName}
                          type="button"
                          onClick={() =>
                            setSettings((current) => ({ ...current, modelName }))
                          }
                          className={`model-chip${isSelected ? " model-chip--selected" : ""}`}
                        >
                          <strong
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              color: isSelected ? "var(--accent-dark)" : "var(--text)",
                              lineHeight: 1.3,
                            }}
                          >
                            {model}
                          </strong>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--muted)",
                              lineHeight: 1.3,
                            }}
                          >
                            {providerLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="empty-state">No models match your search.</p>
                )}

                <p className="field-note">
                  All listed models are verified to work with the AI parsing flow.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle eyebrow="Prompt">System instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stack-form">
                <label>
                  System prompt
                  <textarea
                    rows="7"
                    value={settings.systemPrompt}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, systemPrompt: event.target.value }))
                    }
                    placeholder="Example: Prefer Food for groceries, keep notes short, and always use PK time context."
                  />
                </label>
                <p className="field-note">
                  Prepended to every AI parsing request.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="page-actions">
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? <RefreshCw className="spin" size={15} /> : <Save size={15} />}
              {isSaving ? "Saving settings..." : "Save AI settings"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
