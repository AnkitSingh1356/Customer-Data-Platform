const auditSvc = require("../services/auditService");

/**
 * Normalises service/DB errors into a consistent JSON error response shape.
 * Usage: Called internally by all audit controller handlers on catch.
 * @param {import('express').Response} res - Express response object
 * @param {{ status?: number, message?: string }} e - Error thrown by the service layer
 * @returns {void} Sends a JSON error response with the appropriate HTTP status code
 */
const handleErr = (res, e) =>
  res.status(e.status || 500).json({ error: e.message || "Server error" });

/**
 * Returns a paginated audit trail with optional filters for action, keyword, date range, and target user.
 * Usage: Called by Express router on GET /audit/logs
 * @param {import('express').Request} req - req.query may contain { page, limit, action, search, from, to, target_user_id }
 * @param {import('express').Response} res - Sends JSON response
 * @returns {Promise<void>} JSON paginated list of audit log entries matching the supplied filters
 */
async function listLogs(req, res) {
  try {
    const { page, limit, action, search, from, to, target_user_id } = req.query;
    return res.json(await auditSvc.getLogs({ page, limit, action, search, from, to, target_user_id }));
  } catch (e) { return handleErr(res, e); }
}

module.exports = { listLogs };
