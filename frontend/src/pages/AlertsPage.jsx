import { AlertTriangle, TrendingDown, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAlerts, markAlertAsRead } from "../api/alertApi";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, MetricCard } from "../components/ui/Card";
import { Pagination } from "../components/ui/Pagination";
import { formatDateTimeLabel } from "../utils/formatters";

const ITEMS_PER_PAGE = 10;

function getAlertTypeMeta(alertType) {
  if (alertType === "budget_exceeded") return { Icon: TrendingDown, color: "var(--danger)" };
  if (alertType === "near_limit") return { Icon: AlertTriangle, color: "var(--warning)" };
  return { Icon: Zap, color: "#5f6cf2" };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
    setError("");
    try {
      await markAlertAsRead(alertId);
      const response = await fetchAlerts(unreadOnly);
      setAlerts(response.alerts);
    } catch (e) { setError(e.message); }
  }

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const totalPages = Math.ceil(alerts.length / ITEMS_PER_PAGE);
  const paginatedAlerts = alerts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Alerts</p>
          <h2>Review the signals that need attention.</h2>
          <p className="page-copy">
            Keep unread warnings visible and clear them once you have reviewed the spending pattern.
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

      {error ? <p className="form-error">{error}</p> : null}

      <div className="metric-grid" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
        <MetricCard eyebrow="Visible alerts" value={alerts.length} description="Matching the current filter" />
        <MetricCard eyebrow="Unread" value={unreadCount} description="Still waiting for review" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle eyebrow="Queue">Alert activity</CardTitle>
          <Badge variant={unreadOnly ? "accent" : "muted"}>
            {unreadOnly ? "Unread filter on" : "All alerts"}
          </Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="loading-pulse">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <p className="empty-state">No alerts for the current filter.</p>
          ) : (
            <>
              <ul className="alert-list">
                {paginatedAlerts.map((alert) => {
                  const { Icon, color } = getAlertTypeMeta(alert.alertType);
                  return (
                    <li key={alert.id} className={!alert.isRead ? "unread" : ""}>
                      <div>
                        <div className="alert-eyebrow">
                          <Icon size={15} color={color} />
                          <p className="eyebrow">{alert.alertType.replace(/_/g, " ")}</p>
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
                        >
                          Mark as read
                        </Button>
                      ) : (
                        <Badge variant="muted">Read</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
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
