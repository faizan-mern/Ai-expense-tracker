import { AlertCircle, AlertTriangle, CheckCheck, TrendingDown, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAlerts, markAlertAsRead, markAllAlertsAsRead } from "../api/alertApi";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, MetricCard } from "../components/ui/Card";
import { Pagination } from "../components/ui/Pagination";
import { useToast } from "../components/ui/Toast";
import { formatDateTimeLabel } from "../utils/formatters";

const ITEMS_PER_PAGE = 10;

const ALERT_TYPE_LABELS = {
  near_limit: "Approaching limit",
  budget_exceeded: "Budget exceeded",
  unusual_expense: "Unusual spend",
};

function isToday(dateString) {
  const today = new Date().toDateString();
  return new Date(dateString).toDateString() === today;
}

function getAlertTypeMeta(alertType) {
  if (alertType === "budget_exceeded") return { Icon: TrendingDown, color: "var(--danger)" };
  if (alertType === "near_limit") return { Icon: AlertTriangle, color: "var(--warning)" };
  return { Icon: Zap, color: "#177B5A" };
}

function getAlertBorderColor(alertType) {
  if (alertType === "budget_exceeded") {
    return "#c0392b";
  }

  if (alertType === "near_limit") {
    return "#e67e22";
  }

  return "#177B5A";
}

export default function AlertsPage() {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isCancelled = false;

    async function loadAlerts() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetchAlerts(unreadOnly);
        if (!isCancelled) {
          setAlerts(response.alerts);
          setCurrentPage(1);
          setIsLoading(false);
        }
      } catch (e) {
        if (!isCancelled) { setError(e.message); setIsLoading(false); }
      }
    }

    loadAlerts();
    return () => { isCancelled = true; };
  }, [unreadOnly]);

  async function handleMarkAsRead(alertId) {
    setMarkingId(alertId);
    setError("");
    try {
      await markAlertAsRead(alertId);
      // Optimistic update: flip isRead locally, avoids a full re-fetch
      setAlerts((current) =>
        unreadOnly
          ? current.filter((a) => a.id !== alertId)
          : current.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
      );
      showToast("Alert marked as read", "success");
    } catch (e) {
      setError(e.message);
      showToast(e.message, "error");
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllAsRead() {
    setIsMarkingAll(true);
    setError("");
    try {
      await markAllAlertsAsRead();
      setAlerts((current) =>
        unreadOnly ? [] : current.map((a) => ({ ...a, isRead: true }))
      );
      showToast("All alerts marked as read", "success");
    } catch (e) {
      setError(e.message);
      showToast(e.message, "error");
    } finally {
      setIsMarkingAll(false);
    }
  }

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const totalPages = Math.ceil(alerts.length / ITEMS_PER_PAGE);
  const paginatedAlerts = alerts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const todayAlerts = paginatedAlerts.filter((alert) => isToday(alert.createdAt));
  const earlierAlerts = paginatedAlerts.filter((alert) => !isToday(alert.createdAt));

  function renderAlertItem(alert) {
    const { Icon, color } = getAlertTypeMeta(alert.alertType);
    const alertBorderColor = getAlertBorderColor(alert.alertType);

    return (
      <li
        key={alert.id}
        className={!alert.isRead ? "unread" : ""}
        style={{
          borderLeft: `3px solid ${alertBorderColor}`,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          paddingLeft: "0.8rem",
        }}
      >
        <div>
          <div className="alert-eyebrow">
            <Icon size={15} color={color} />
            <p className="eyebrow">
              {ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}
            </p>
          </div>
          <strong className="text-sm">{alert.message}</strong>
          <small className="text-[#63736b]">
            {formatDateTimeLabel(alert.createdAt)}
          </small>
        </div>
        {!alert.isRead ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleMarkAsRead(alert.id)}
            disabled={markingId === alert.id}
          >
            {markingId === alert.id ? "Marking..." : "Mark as read"}
          </Button>
        ) : (
          <Badge variant="muted">Read</Badge>
        )}
      </li>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Alerts</p>
          <h2>Alerts and exceptions</h2>
          <p className="page-copy">
            Review budget thresholds and unusual spending activity.
          </p>
        </div>
        <label className="inline-toggle">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          Unread only
        </label>
      </header>

      {error ? (
        <div className="form-error">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      ) : null}

      <div className="metric-grid metric-grid--2col">
        <MetricCard eyebrow="Visible alerts" value={alerts.length} description="Matching the current filter" />
        <MetricCard eyebrow="Unread" value={unreadCount} description="Still waiting for review" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle eyebrow="Queue">Alert activity</CardTitle>
          <div className="button-row">
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
              >
                <CheckCheck size={14} />
                {isMarkingAll ? "Clearing..." : "Mark all as read"}
              </Button>
            )}
            <Badge variant={unreadOnly ? "accent" : "muted"}>
              {unreadOnly ? "Unread filter on" : "All alerts"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="loading-pulse">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <p className="empty-state">No alerts for the current filter.</p>
          ) : (
            <>
              {todayAlerts.length > 0 ? (
                <div style={{ marginBottom: "0.75rem" }}>
                  <p className="eyebrow" style={{ margin: 0 }}>Today</p>
                </div>
              ) : null}
              {todayAlerts.length > 0 ? (
                <ul className="alert-list" style={{ marginBottom: "1rem" }}>
                  {todayAlerts.map((alert) => renderAlertItem(alert))}
                </ul>
              ) : null}
              {earlierAlerts.length > 0 ? (
                <div style={{ marginBottom: "0.75rem" }}>
                  <p className="eyebrow" style={{ margin: 0 }}>Earlier</p>
                </div>
              ) : null}
              {earlierAlerts.length > 0 ? (
                <ul className="alert-list">
                  {earlierAlerts.map((alert) => renderAlertItem(alert))}
                </ul>
              ) : null}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
