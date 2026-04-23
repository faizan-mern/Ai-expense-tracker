import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchAiSettings,
  fetchAvailableModels,
  saveAiSettings,
} from "../api/aiSettingsApi";
import { useToast } from "../components/ui/Toast";

const initialSettings = {
  apiKey: "",
  baseURL: "",
  model: "",
  systemPrompt: "",
};

export default function AiSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(initialSettings);
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingModel, setIsSavingModel] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadSettings() {
      try {
        const response = await fetchAiSettings();

        if (!isCancelled) {
          setSettings({
            apiKey: response.settings.apiKey || "",
            baseURL: response.settings.baseURL || "",
            model: response.settings.model || "",
            systemPrompt: response.settings.systemPrompt || "",
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

  async function handleSaveApiConfiguration() {
    setError("");
    setIsSavingConfig(true);

    try {
      const response = await saveAiSettings({
        apiKey: settings.apiKey,
        baseURL: settings.baseURL,
        model: settings.model,
        systemPrompt: settings.systemPrompt,
      });

      setSettings((current) => ({
        ...current,
        apiKey: response.settings.apiKey || "",
        baseURL: response.settings.baseURL || "",
      }));
      showToast("AI configuration saved", "success");
    } catch (saveError) {
      setError(saveError.message);
      showToast(saveError.message, "error");
    } finally {
      setIsSavingConfig(false);
    }
  }

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

  async function handleSaveModel() {
    setError("");
    setIsSavingModel(true);

    try {
      const response = await saveAiSettings({
        apiKey: settings.apiKey,
        baseURL: settings.baseURL,
        model: settings.model,
        systemPrompt: settings.systemPrompt,
      });

      setSettings((current) => ({
        ...current,
        apiKey: response.settings.apiKey || current.apiKey,
        model: response.settings.model || current.model,
      }));
      showToast("AI model saved", "success");
    } catch (saveError) {
      setError(saveError.message);
      showToast(saveError.message, "error");
    } finally {
      setIsSavingModel(false);
    }
  }

  async function handleSaveSystemPrompt() {
    setError("");
    setIsSavingPrompt(true);

    try {
      const response = await saveAiSettings({
        apiKey: settings.apiKey,
        baseURL: settings.baseURL,
        model: settings.model,
        systemPrompt: settings.systemPrompt,
      });

      setSettings((current) => ({
        ...current,
        apiKey: response.settings.apiKey || current.apiKey,
        systemPrompt: response.settings.systemPrompt || current.systemPrompt,
      }));
      showToast("System prompt saved", "success");
    } catch (saveError) {
      setError(saveError.message);
      showToast(saveError.message, "error");
    } finally {
      setIsSavingPrompt(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI Settings</p>
          <h2>Control how the AI expense parser behaves.</h2>
          <p className="page-copy">
            Update the API connection, choose a model, and tune the extraction instructions without changing code.
          </p>
        </div>
      </header>

      <section className="panel panel--soft">
        <p className="empty-state">
          Settings are stored in memory and reset when the server restarts. For permanent config, set values in
          backend/.env
        </p>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      {isLoading ? (
        <section className="panel">
          <div className="loading-pulse">Loading...</div>
        </section>
      ) : (
        <div className="stack-group">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">API Configuration</p>
                <h3>Connection details</h3>
              </div>
            </div>
            <div className="stack-form">
              <label>
                API Key
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, apiKey: event.target.value }))
                  }
                  placeholder="sk-or-••••••••"
                />
                <span>Your OpenRouter or OpenAI API key. Stored only in memory for this session.</span>
              </label>

              <label>
                Base URL
                <input
                  type="text"
                  value={settings.baseURL}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, baseURL: event.target.value }))
                  }
                  placeholder="https://openrouter.ai/api/v1"
                />
                <span>Leave blank to use the default OpenRouter endpoint.</span>
              </label>

              <button
                type="button"
                className="primary-button"
                onClick={handleSaveApiConfiguration}
                disabled={isSavingConfig}
              >
                {isSavingConfig ? "Saving..." : "Save API Configuration"}
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Model Selection</p>
                <h3>Choose an available model</h3>
              </div>
              {settings.model ? (
                <span className="status-pill">
                  <CheckCircle2 size={14} />
                  <span>{settings.model}</span>
                </span>
              ) : null}
            </div>
            <div className="stack-form">
              <div className="button-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleLoadModels}
                  disabled={isLoadingModels}
                >
                  {isLoadingModels ? "Fetching models..." : "Load available models"}
                </button>
              </div>

              {isLoadingModels ? <p className="empty-state">Fetching models...</p> : null}

              {models.length > 0 ? (
                <label>
                  Available models
                  <select
                    value={settings.model}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, model: event.target.value }))
                    }
                  >
                    <option value="">Select a model</option>
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="empty-state">
                  Load available models to choose from the configured provider.
                </p>
              )}

              <button
                type="button"
                className="primary-button"
                onClick={handleSaveModel}
                disabled={isSavingModel || !settings.model}
              >
                {isSavingModel ? "Saving..." : "Save Model"}
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">System Prompt</p>
                <h3>Guide the extraction behavior</h3>
              </div>
            </div>
            <div className="stack-form">
              <label>
                System prompt
                <textarea
                  rows="6"
                  value={settings.systemPrompt}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, systemPrompt: event.target.value }))
                  }
                />
                <span>This tells the AI how to extract expense data from your text.</span>
              </label>

              <button
                type="button"
                className="primary-button"
                onClick={handleSaveSystemPrompt}
                disabled={isSavingPrompt}
              >
                {isSavingPrompt ? "Saving..." : "Save System Prompt"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
