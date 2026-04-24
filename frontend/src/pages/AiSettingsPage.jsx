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
const FALLBACK_MODEL_OPTIONS = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (Paid)" },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku (Paid)" },
  { id: "inclusionai/ling-2.6-1t:free", name: "Ling 2.6 1T (Free)" },
  { id: "inclusionai/ling-2.6-flash:free", name: "Ling 2.6 Flash (Free)" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron Super 120B (Free)" },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron Nano 30B (Free)" },
  { id: "nvidia/nemotron-nano-9b-v2:free", name: "Nemotron Nano 9B (Free)" },
  { id: "nvidia/nemotron-nano-12b-v2-vl:free", name: "Nemotron Nano 12B (Free)" },
];

function formatModelLabel(modelId) {
  if (!modelId) return modelId;
  const slashIdx = modelId.indexOf("/");
  if (slashIdx === -1) return modelId;
  const provider = modelId.slice(0, slashIdx);
  const model = modelId.slice(slashIdx + 1);
  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
  return `${model} - ${providerLabel}`;
}

function getModelId(modelOption) {
  if (modelOption && typeof modelOption === "object") {
    return String(modelOption.id || "");
  }

  return String(modelOption || "");
}

function getModelLabel(modelOption) {
  if (modelOption && typeof modelOption === "object") {
    return modelOption.name || modelOption.id || "";
  }

  return String(modelOption || "");
}

function dedupeModelOptions(modelOptions) {
  const seen = new Set();
  const deduped = [];

  for (const option of modelOptions) {
    const id = getModelId(option).trim();
    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    deduped.push(option);
  }

  return deduped;
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
  const [models, setModels] = useState(FALLBACK_MODEL_OPTIONS);
  const [modelsSource, setModelsSource] = useState("curated");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
            const loadedModels =
              Array.isArray(modelsResult.value.models) &&
              modelsResult.value.models.length > 0
                ? modelsResult.value.models
                : FALLBACK_MODEL_OPTIONS;

            setModels(loadedModels);
            setModelsSource(modelsResult.value.source || "curated");
          } else {
            setModels(FALLBACK_MODEL_OPTIONS);
            setModelsSource("curated");
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

  const searchableModels = models.length > 0 ? models : FALLBACK_MODEL_OPTIONS;
  const visibleModels = dedupeModelOptions(
    [
      ...searchableModels,
      settings.modelName || DEFAULT_MODEL,
    ]
  );

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
                  Your key is used for all AI requests. Leave blank to use the app default.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle eyebrow="Model">Active model</CardTitle>
              <Badge variant="muted">8 models</Badge>
            </CardHeader>
            <CardContent>
              <div className="stack-form">
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
                  >
                    {visibleModels.map((modelOption) => {
                      const modelId = getModelId(modelOption);
                      const modelLabel = getModelLabel(modelOption);

                      return (
                        <option key={modelId} value={modelId}>
                          {modelLabel}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <p className="field-note">
                  Only models that support structured output are shown.
                </p>
                {modelsSource === "curated" ? (
                  <p className="field-note">
                    Only confirmed working models are shown.
                  </p>
                ) : null}
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
