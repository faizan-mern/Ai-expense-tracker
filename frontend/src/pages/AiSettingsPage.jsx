import { RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchAiSettings,
  fetchAvailableModels,
  saveAiSettings,
} from "../api/aiSettingsApi";
import { useToast } from "../components/ui/Toast";

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const initialSettings = {
  apiKey: "",
  modelName: DEFAULT_MODEL,
  systemPrompt: "",
  baseURL: "",
};

export default function AiSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(initialSettings);
  const [models, setModels] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

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

    return () => {
      isCancelled = true;
    };
  }, [showToast]);

  async function handleLoadModels() {
    setError("");
    setIsLoadingModels(true);

    try {
      const response = await fetchAvailableModels();
      setModels(response.models || []);
      showToast("Available models loaded", "success");
    } catch (loadError) {
      setError(loadError.message);
      showToast(loadError.message, "error");
    } finally {
      setIsLoadingModels(false);
    }
  }

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
        modelName:
          response.settings.modelName || response.settings.model || current.modelName,
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

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI Settings</p>
          <h2>Control how the expense assistant parses text.</h2>
          <p className="page-copy">
            Save your provider key, choose a model, and tune the system prompt from one stable
            place.
          </p>
        </div>
        <span className="status-pill">{settings.modelName || DEFAULT_MODEL}</span>
      </header>

      <section className="panel panel--soft">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Provider</p>
            <h3>Current connection</h3>
          </div>
        </div>
        <div className="stack-group stack-group--compact">
          <p className="empty-state">
            Settings are saved per signed-in user. If no personal key is saved, the backend falls
            back to its local environment configuration.
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
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      {isLoading ? (
        <section className="panel">
          <div className="loading-pulse">Loading AI settings...</div>
        </section>
      ) : (
        <form className="stack-group" onSubmit={handleSaveSettings}>
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Credentials</p>
                <h3>Provider access</h3>
              </div>
            </div>
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
                Keep the masked value to preserve the current key, or replace it to save a new one.
              </p>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Model</p>
                <h3>Choose the parser model</h3>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={handleLoadModels}
                disabled={isLoadingModels}
              >
                {isLoadingModels ? (
                  <span className="btn-content">
                    <RefreshCw className="spin" size={16} />
                    <span>Loading models...</span>
                  </span>
                ) : (
                  <span className="btn-content">
                    <RefreshCw size={16} />
                    <span>Refresh models</span>
                  </span>
                )}
              </button>
            </div>
            <div className="stack-form">
              <label>
                Available models
                <select
                  value={settings.modelName}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, modelName: event.target.value }))
                  }
                  disabled={isLoadingModels}
                >
                  {(models.length > 0 ? models : [settings.modelName || DEFAULT_MODEL]).map(
                    (modelName) => (
                      <option key={modelName} value={modelName}>
                        {modelName}
                      </option>
                    )
                  )}
                </select>
              </label>
              <p className="field-note">
                The assistant page will use this saved model whenever it parses an expense.
              </p>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Prompt</p>
                <h3>System instructions</h3>
              </div>
            </div>
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
                These instructions are appended before the user text in the AI parsing flow.
              </p>
            </div>
          </section>

          <div className="page-actions">
            <button type="submit" className="primary-button" disabled={isSaving}>
              <span className="btn-content">
                {isSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
                <span>{isSaving ? "Saving settings..." : "Save AI settings"}</span>
              </span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
