import { AlertCircle, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchAiSettings,
  fetchAvailableModels,
  saveAiSettings,
} from "../api/aiApi";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";

const DEFAULT_MODEL = "openai/gpt-4o-mini";

function formatModelLabel(modelId) {
  if (!modelId) return modelId;
  const slashIdx = modelId.indexOf("/");
  if (slashIdx === -1) return modelId;
  const provider = modelId.slice(0, slashIdx);
  const model = modelId.slice(slashIdx + 1);
  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
  return `${model} - ${providerLabel}`;
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
  const [models, setModels] = useState([]);
  const [modelSearch, setModelSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadPageData() {
      try {
        const [settingsResult, modelsResult] = await Promise.allSettled([
          fetchAiSettings(),
          fetchAvailableModels(),
        ]);

        if (!isCancelled) {
          if (settingsResult.status === "fulfilled") {
            setSettings({
              apiKey: settingsResult.value.settings.apiKey || "",
              modelName:
                settingsResult.value.settings.modelName ||
                settingsResult.value.settings.model ||
                DEFAULT_MODEL,
              systemPrompt: settingsResult.value.settings.systemPrompt || "",
              baseURL: settingsResult.value.settings.baseURL || "",
            });
          } else {
            setError(settingsResult.reason.message);
            showToast(settingsResult.reason.message, "error");
          }

          if (modelsResult.status === "fulfilled") {
            setModels(modelsResult.value.models || []);
          }

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

    loadPageData();

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
          response.settings.modelName ||
          response.settings.model ||
          current.modelName,
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

  const visibleModels =
    models.length > 0
      ? models.filter((model) =>
          model.toLowerCase().includes(modelSearch.toLowerCase())
        )
      : [settings.modelName || DEFAULT_MODEL];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI Settings</p>
          <h2>AI parser settings</h2>
          <p className="page-copy">
            Manage your provider key, active model, and parsing instructions.
          </p>
        </div>
        <Badge variant="default">
          {formatModelLabel(settings.modelName || DEFAULT_MODEL)}
        </Badge>
      </header>

      <Card soft>
        <CardHeader>
          <CardTitle eyebrow="Connection">Current provider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="stack-group stack-group--compact">
            <p className="empty-state">
              Personal settings override the backend defaults for this account.
            </p>
            <div className="kv-grid">
              <div>
                <span className="kv-label">Base URL</span>
                <strong>{settings.baseURL || "Backend default"}</strong>
              </div>
              <div>
                <span className="kv-label">Saved key</span>
                <strong>{settings.apiKey ? "Configured" : "No personal key saved"}</strong>
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
              <CardTitle eyebrow="Credentials">Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stack-form">
                <label>
                  API key
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        apiKey: event.target.value,
                      }))
                    }
                    placeholder="sk-or-v1-..."
                  />
                </label>
                <p className="field-note">
                  Leave this unchanged if you want to keep the current key.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle eyebrow="Model">Active model</CardTitle>
              <div className="button-row">
                <Badge variant="muted">
                  {models.length > 0 ? `${visibleModels.length} models` : "Saved model"}
                </Badge>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleLoadModels}
                  disabled={isLoadingModels}
                >
                  <RefreshCw size={14} className={isLoadingModels ? "spin" : ""} />
                  {isLoadingModels ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="stack-form">
                {models.length > 0 ? (
                  <label>
                    Search models
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(event) => setModelSearch(event.target.value)}
                      placeholder="Filter the available list"
                    />
                  </label>
                ) : (
                  <p className="field-note">
                    The saved model is shown below. Use refresh to retry loading
                    the full provider list.
                  </p>
                )}
                <label>
                  Model
                  <select
                    value={settings.modelName}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        modelName: event.target.value,
                      }))
                    }
                    disabled={isLoadingModels}
                  >
                    {visibleModels.map((modelName) => (
                      <option key={modelName} value={modelName}>
                        {formatModelLabel(modelName)}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="field-note">
                  All available models are loaded on entry when the provider
                  endpoint responds successfully.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle eyebrow="Instructions">System prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stack-form">
                <label>
                  Prompt
                  <textarea
                    rows="7"
                    value={settings.systemPrompt}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        systemPrompt: event.target.value,
                      }))
                    }
                    placeholder="Example: Keep notes short and prefer PK time context."
                  />
                </label>
                <p className="field-note">
                  Added to each parsing request before the user message.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="page-actions">
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? <RefreshCw className="spin" size={15} /> : <Save size={15} />}
              {isSaving ? "Saving settings..." : "Save settings"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
