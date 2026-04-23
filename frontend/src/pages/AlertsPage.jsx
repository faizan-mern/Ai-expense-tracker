import { AlertTriangle, TrendingDown, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAlerts, markAlertAsRead } from "../api/alertApi";
import { formatDateTimeLabel } from "../utils/formatters";

function getAlertTypeMeta(alertType) {
  if (alertType === "budget_exceeded") {
    return {
      Icon: TrendingDown,
      color: "var(--danger)",
    };
  }

  if (alertType === "near_limit") {
    return {
      Icon: AlertTriangle,
      color: "#d97706",
    };
  }

  return {
    Icon: Zap,
    color: "#7c3aed",
  };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadAlerts() {
      try {
        const response = await fetchAlerts(unreadOnly);

        if (!isCancelled) {
          setAlerts(response.alerts);
          setIsLoading(false);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.message);
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    setError("");
    loadAlerts();

    return () => {
      isCancelled = true;
    };
  }, [unreadOnly]);

  async function handleMarkAsRead(alertId) {
    setError("");

    try {
      await markAlertAsRead(alertId);
      const response = await fetchAlerts(unreadOnly);
      setAlerts(response.alerts);
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Alerts</p>
          <h2>Review the signals that need attention.</h2>
          <p className="page-copy">
            Keep unread warnings visible and clear them once you've checked the spending pattern behind them.
          </p>
        </div>
        <label className="inline-toggle">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => setUnreadOnly(event.target.checked)}
          />
          Show unread only
        </label>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="metric-grid">
        <article className="metric-card">
          <p className="eyebrow">Visible alerts</p>
          <strong>{alerts.length}</strong>
          <span>Matching the current filter</span>
        </article>
        <article className="metric-card">
          <p className="eyebrow">Unread</p>
          <strong>{unreadCount}</strong>
          <span>Still waiting for review</span>
        </article>
      </div>

      <section className="panel">
        {isLoading ? (
          <div className="loading-pulse">Loading...</div>
        ) : alerts.length === 0 ? (
          <p className="empty-state">No alerts for the current filter.</p>
        ) : (
          <ul className="alert-list">
            {alerts.map((alert) => {
              const { Icon, color } = getAlertTypeMeta(alert.alertType);

              return (
                <li key={alert.id} className={!alert.isRead ? "unread" : ""}>
                  <div>
                    <div className="alert-eyebrow">
                      <Icon size={16} color={color} />
                      <p className="eyebrow">{alert.alertType.replace(/_/g, " ")}</p>
                    </div>
                    <strong>{alert.message}</strong>
                    <small>{formatDateTimeLabel(alert.createdAt)}</small>
                  </div>
                  {!alert.isRead ? (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleMarkAsRead(alert.id)}
                    >
                      Mark as read
                    </button>
                  ) : (
                    <span className="status-pill">Read</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}
