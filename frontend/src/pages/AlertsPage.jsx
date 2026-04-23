import { useEffect, useState } from "react";
import { fetchAlerts, markAlertAsRead } from "../api/alertApi";

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

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Alerts</p>
          <h2>Review the warnings and anomalies your backend is already generating.</h2>
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

      <section className="panel">
        {isLoading ? (
          <p>Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p>No alerts for the current filter.</p>
        ) : (
          <ul className="alert-list">
            {alerts.map((alert) => (
              <li key={alert.id} className={!alert.isRead ? "unread" : ""}>
                <div>
                  <p className="eyebrow">{alert.alertType.replace(/_/g, " ")}</p>
                  <strong>{alert.message}</strong>
                  <small>{new Date(alert.createdAt).toLocaleString()}</small>
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
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
