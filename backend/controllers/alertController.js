const pool = require("../db");

function mapAlertRow(row) {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    expenseId: row.expense_id === null ? null : Number(row.expense_id),
    budgetId: row.budget_id === null ? null : Number(row.budget_id),
    alertType: row.alert_type,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

async function getAlerts(req, res) {
  const userId = req.user.userId;
  const unreadOnly = req.query.unreadOnly === "true";

  const values = [userId];
  let whereClause = "WHERE user_id = $1";

  if (unreadOnly) {
    whereClause += " AND is_read = FALSE";
  }

  try {
    const result = await pool.query(
      `SELECT id, user_id, expense_id, budget_id, alert_type, message, is_read, created_at
       FROM alerts
       ${whereClause}
       ORDER BY created_at DESC, id DESC`,
      values
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      alerts: result.rows.map(mapAlertRow),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
      error: error.message,
    });
  }
}

async function markAlertAsRead(req, res) {
  const alertId = Number(req.params.id);
  const userId = req.user.userId;

  if (!Number.isInteger(alertId)) {
    return res.status(400).json({
      success: false,
      message: "Alert id must be a valid number",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE alerts
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, expense_id, budget_id, alert_type, message, is_read, created_at`,
      [alertId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Alert marked as read",
      alert: mapAlertRow(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update alert",
      error: error.message,
    });
  }
}

module.exports = {
  getAlerts,
  markAlertAsRead,
};
