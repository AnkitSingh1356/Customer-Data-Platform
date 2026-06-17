const pool = require("../config/db");

// Canonical action-type constants shared across all permission audit calls
const ACTIONS = {
  USER_CREATED:         "USER_CREATED",
  USER_UPDATED:         "USER_UPDATED",
  USER_ACTIVATED:       "USER_ACTIVATED",
  USER_DEACTIVATED:     "USER_DEACTIVATED",
  USER_ROLES_UPDATED:   "USER_ROLES_UPDATED",
  ROLE_CREATED:         "ROLE_CREATED",
  ROLE_UPDATED:         "ROLE_UPDATED",
  ROLE_DELETED:         "ROLE_DELETED",
  ROLE_CLONED:          "ROLE_CLONED",
  PERMISSIONS_UPDATED:  "PERMISSIONS_UPDATED",
  MENU_ACCESS_UPDATED:  "MENU_ACCESS_UPDATED",
  PAGE_ACCESS_UPDATED:  "PAGE_ACCESS_UPDATED",
};

// Persists a permission-change event; errors are swallowed so audit never
// blocks the operation that triggered it
async function log({
  action,
  performedBy,
  targetUser,
  targetRole,
  entityType,
  oldValue,
  newValue,
  metadata,
}) {
  try {
    // Serialise before/after state as JSONB for flexible querying
    await pool.query(
      `INSERT INTO permission_audit_logs
         (action, performed_by_id, performed_by_name,
          target_user_id, target_user_name,
          target_role_id, target_role_name,
          entity_type, old_value, new_value, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        action,
        performedBy?.id   ?? null,
        performedBy?.full_name ?? performedBy?.email ?? null,
        targetUser?.id    ?? null,
        targetUser?.full_name ?? targetUser?.name ?? null,
        targetRole?.id    ?? null,
        targetRole?.name  ?? null,
        entityType ?? null,
        oldValue  != null ? JSON.stringify(oldValue)  : null,
        newValue  != null ? JSON.stringify(newValue)  : null,
        metadata  != null ? JSON.stringify(metadata)  : null,
      ]
    );
  } catch (e) {
    console.error("[Audit] Failed to write log:", e.message);
  }
}

// Returns a paginated, filterable list of permission audit log entries
async function getLogs({
  page           = 1,
  limit          = 20,
  action         = "",
  search         = "",
  from           = "",
  to             = "",
  target_user_id = "",
} = {}) {
  const conditions = [];
  const params     = [];

  // Build WHERE clause dynamically; only applied filters add parameters
  if (target_user_id) {
    params.push(parseInt(target_user_id, 10));
    conditions.push(`l.target_user_id = $${params.length}`);
  }
  if (action) {
    params.push(action);
    conditions.push(`l.action = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(l.performed_by_name ILIKE $${params.length} OR l.target_user_name ILIKE $${params.length} OR l.target_role_name ILIKE $${params.length})`
    );
  }
  if (from) {
    params.push(from);
    conditions.push(`l.created_at >= $${params.length}::timestamptz`);
  }
  if (to) {
    // Add one day so the 'to' date is inclusive of the entire day
    params.push(to);
    conditions.push(`l.created_at <= ($${params.length}::date + INTERVAL '1 day')`);
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  // Count with same filters before appending LIMIT/OFFSET params
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM permission_audit_logs l ${where}`,
    params
  );

  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  const res = await pool.query(
    `SELECT l.*
     FROM permission_audit_logs l
     ${where}
     ORDER BY l.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    logs:  res.rows,
    total: parseInt(countRes.rows[0].count, 10),
    page:  Number(page),
    limit: Number(limit),
  };
}

module.exports = { log, getLogs, ACTIONS };
