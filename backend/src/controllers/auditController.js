const auditSvc = require("../services/auditService");

const handleErr = (res, e) =>
  res.status(e.status || 500).json({ error: e.message || "Server error" });

async function listLogs(req, res) {
  try {
    const { page, limit, action, search, from, to, target_user_id } = req.query;
    return res.json(await auditSvc.getLogs({ page, limit, action, search, from, to, target_user_id }));
  } catch (e) { return handleErr(res, e); }
}

module.exports = { listLogs };
