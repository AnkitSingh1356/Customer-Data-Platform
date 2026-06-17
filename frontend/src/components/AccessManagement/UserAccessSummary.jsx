// Modal that displays a full read-only access profile for a single user,
// covering permissions, menu/page access, security risk level, and audit history.
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { rbacApi, auditApi } from "../../services/rbacService";

// ─── Constants ────────────────────────────────────────────────
const PERM_ACTIONS = ["create", "read", "update", "delete", "export", "import"];

const CUSTOMER_TYPE_META = {
  "Dealer":       { cls: "am-pill--dealer",   label: "Dealer" },
  "B2B Customer": { cls: "am-pill--b2b",      label: "B2B Customer" },
  "B2C Customer": { cls: "am-pill--b2c",      label: "B2C Customer" },
  "Employee":     { cls: "am-pill--employee", label: "Employee" },
};

const ACTION_META = {
  USER_CREATED:        { label: "User Created",        color: "#16a34a" },
  USER_UPDATED:        { label: "User Updated",        color: "#2563eb" },
  USER_ACTIVATED:      { label: "User Activated",      color: "#16a34a" },
  USER_DEACTIVATED:    { label: "User Deactivated",    color: "#d97706" },
  USER_ROLES_UPDATED:  { label: "Roles Changed",       color: "#7c3aed" },
  ROLE_CREATED:        { label: "Role Created",        color: "#16a34a" },
  ROLE_UPDATED:        { label: "Role Updated",        color: "#2563eb" },
  ROLE_DELETED:        { label: "Role Deleted",        color: "#dc2626" },
  ROLE_CLONED:         { label: "Role Cloned",         color: "#0891b2" },
  PERMISSIONS_UPDATED: { label: "Permissions Updated", color: "#7c3aed" },
  MENU_ACCESS_UPDATED: { label: "Menu Access Updated", color: "#7c3aed" },
  PAGE_ACCESS_UPDATED: { label: "Page Access Updated", color: "#7c3aed" },
};

const SUMMARY_TABS = [
  { id: "overview",    label: "Overview" },
  { id: "permissions", label: "Permissions" },
  { id: "activity",    label: "Activity & Security" },
  { id: "history",     label: "Access History" },
];

// ─── Helpers ──────────────────────────────────────────────────
function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function daysSince(ts) {
  if (!ts) return null;
  const ms = Date.now() - new Date(ts).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// Derives a security risk level from account status, role assignments, and
// days since last login. High = inactive or no permissions; Medium = stale login.
function riskLevel(user, access) {
  if (!user.is_active) return { level: "High", color: "#dc2626", bg: "#fef2f2" };
  const roles = access?.permissions?.length > 0 || access?.is_admin;
  const days  = daysSince(user.last_login);
  if (!roles) return { level: "High", color: "#dc2626", bg: "#fef2f2" };
  if (days === null || days > 90) return { level: "Medium", color: "#d97706", bg: "#fffbeb" };
  if (days > 30) return { level: "Medium", color: "#d97706", bg: "#fffbeb" };
  return { level: "Low", color: "#16a34a", bg: "#f0fdf4" };
}

// ─── Small sub-components ─────────────────────────────────────
function StatCard({ value, label }) {
  return (
    <div className="uas-stat-card">
      <span className="uas-stat-value">{value}</span>
      <span className="uas-stat-label">{label}</span>
    </div>
  );
}

function ActionBadge({ action }) {
  const meta = ACTION_META[action] || { label: action, color: "#6b7280" };
  return (
    <span
      className="am-role-tag am-audit-badge"
      style={{ background: meta.color + "18", color: meta.color, borderColor: meta.color + "40" }}
    >
      {meta.label}
    </span>
  );
}

function CheckIcon({ granted }) {
  return granted
    ? <span className="uas-check uas-check--yes">✓</span>
    : <span className="uas-check uas-check--no">✗</span>;
}

// ─── Tab: Overview ────────────────────────────────────────────
function OverviewTab({ summary }) {
  const { access, all_modules, all_menus, restricted_modules, restricted_pages, user } = summary;

  // Build a "module:action" lookup to resolve effective permissions in O(1).
  const permSet = new Set(access.permissions.map((p) => `${p.module_key}:${p.action}`));

  // Admins implicitly have every action; non-admins are checked against permSet.
  const matrix = all_modules.map((mod) => ({
    ...mod,
    actions: PERM_ACTIONS.reduce((acc, action) => {
      acc[action] = access.is_admin || permSet.has(`${mod.key}:${action}`);
      return acc;
    }, {}),
  }));

  const accessibleMenuKeys = new Set(access.menus.map((m) => m.key));

  const customerType = user.customer_type || "Employee";
  const ctMeta = CUSTOMER_TYPE_META[customerType] || CUSTOMER_TYPE_META["Employee"];

  return (
    <div className="uas-tab-body">
      {/* Effective Permissions Matrix */}
      <div className="uas-section">
        <h4 className="uas-section-title">Effective Permissions</h4>
        <div className="am-table-wrap am-summary-table-wrap">
          <table className="am-matrix-table">
            <thead>
              <tr>
                <th className="am-matrix-module-col am-matrix-module-name">Module</th>
                {PERM_ACTIONS.map((a) => (
                  <th key={a} className="am-matrix-action-col am-col-capitalize">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((mod) => (
                <tr key={mod.key}>
                  <td className="am-matrix-module-name">
                    <span className="am-summary-label">{mod.label}</span>
                    <span className="am-code am-summary-count">{mod.key}</span>
                  </td>
                  {PERM_ACTIONS.map((action) => (
                    <td key={action} className="am-matrix-cell">
                      <CheckIcon granted={mod.actions[action]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Menu Access */}
      <div className="uas-section">
        <h4 className="uas-section-title">Menu Access</h4>
        <div className="uas-tag-list">
          {all_menus.map((menu) => (
            <span
              key={menu.key}
              className="uas-menu-tag"
              style={
                accessibleMenuKeys.has(menu.key)
                  ? { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }
                  : { background: "#f9fafb", color: "#9ca3af", border: "1px solid #e5e7eb" }
              }
            >
              {accessibleMenuKeys.has(menu.key) ? "✓" : "✗"} {menu.label}
            </span>
          ))}
        </div>
      </div>

      {/* Customer Type Access */}
      <div className="uas-section">
        <h4 className="uas-section-title">Customer Type Access</h4>
        <div className="uas-customer-type-grid">
          {Object.entries(CUSTOMER_TYPE_META).map(([type, meta]) => {
            const isOwn = type === customerType;
            const canAccess = access.is_admin || isOwn;
            return (
              <div
                key={type}
                className="uas-ct-card"
                style={canAccess
                  ? { border: "1px solid #bfdbfe", background: "#eff6ff" }
                  : { border: "1px solid #e5e7eb", background: "#f9fafb" }}
              >
                <span className={`am-pill ${meta.cls}`}>{meta.label}</span>
                <span className="uas-ct-status" style={{ color: canAccess ? "#16a34a" : "#9ca3af" }}>
                  {canAccess ? "✓ Access Granted" : "✗ No Access"}
                </span>
              </div>
            );
          })}
        </div>
        {!access.is_admin && (
          <p className="uas-note">
            Access scope is determined by the user's customer type. Admins have cross-type visibility.
          </p>
        )}
        {access.is_admin && (
          <p className="uas-note">Admin users have full cross-type data visibility.</p>
        )}
      </div>

      {/* Restricted Modules & Pages */}
      {!access.is_admin && (
        <div className="uas-row-2col">
          <div className="uas-section">
            <h4 className="uas-section-title">Restricted Modules</h4>
            {restricted_modules.length === 0 ? (
              <p className="am-text-muted" style={{ fontSize: "0.82rem" }}>None — full module access.</p>
            ) : (
              <div className="uas-tag-list">
                {restricted_modules.map((m) => (
                  <span key={m.key} className="uas-restricted-tag">{m.label}</span>
                ))}
              </div>
            )}
          </div>
          <div className="uas-section">
            <h4 className="uas-section-title">Restricted Pages</h4>
            {restricted_pages.length === 0 ? (
              <p className="am-text-muted" style={{ fontSize: "0.82rem" }}>None — full page access.</p>
            ) : (
              <div className="uas-tag-list">
                {restricted_pages.map((p) => (
                  <span key={p.key} className="uas-restricted-tag">{p.label}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Permissions ─────────────────────────────────────────
function PermissionsTab({ summary }) {
  const { access, permission_sources } = summary;

  if (access.is_admin) {
    return (
      <div className="uas-tab-body">
        <div className="uas-admin-notice">
          <span className="uas-admin-icon">🔑</span>
          <div>
            <strong>Full Admin Access</strong>
            <p>This user has the system Admin role. All permissions across every module are granted automatically — not through RBAC role assignments.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!permission_sources.length) {
    return (
      <div className="uas-tab-body">
        <p className="am-text-muted am-permission-cell">
          No role-based permissions assigned. This user has no effective access.
        </p>
      </div>
    );
  }

  // Group raw permission_sources by role so each role card shows its own grants.
  const byRole = permission_sources.reduce((acc, src) => {
    if (!acc[src.role_id]) acc[src.role_id] = { name: src.role_name, byModule: {} };
    const mod = src.module_key;
    if (!acc[src.role_id].byModule[mod]) {
      acc[src.role_id].byModule[mod] = { label: src.module_label, actions: [] };
    }
    acc[src.role_id].byModule[mod].actions.push(src.action);
    return acc;
  }, {});

  // Deduplicate across roles so the consolidated table shows each action once.
  const effectiveSet = new Set(permission_sources.map((s) => `${s.module_key}:${s.action}`));
  const effectiveByModule = permission_sources.reduce((acc, src) => {
    const key = `${src.module_key}:${src.action}`;
    if (!acc[src.module_key]) acc[src.module_key] = { label: src.module_label, actions: new Set() };
    acc[src.module_key].actions.add(src.action);
    return acc;
  }, {});

  return (
    <div className="uas-tab-body">
      {/* Consolidated Effective Access */}
      <div className="uas-section">
        <h4 className="uas-section-title">
          Consolidated Effective Access
          <span className="uas-count-chip">{effectiveSet.size} permissions</span>
        </h4>
        <div className="am-table-wrap">
          <table className="am-table am-table--compact">
            <thead>
              <tr>
                <th>Module</th>
                <th>Granted Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(effectiveByModule).map(([moduleKey, mod]) => (
                <tr key={moduleKey}>
                  <td>
                    <span className="am-stat-bold">{mod.label}</span>
                    <span className="am-code am-stat-margin">{moduleKey}</span>
                  </td>
                  <td>
                    <div className="am-roles-list">
                      {[...mod.actions].sort().map((action) => (
                        <span key={action} className="uas-action-chip">{action}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Source Breakdown */}
      <div className="uas-section">
        <h4 className="uas-section-title">Permission Sources</h4>
        <p className="uas-note am-summary-mb">
          Shows which RBAC roles are granting permissions to this user.
        </p>
        <div className="uas-source-list">
          {Object.entries(byRole).map(([roleId, role]) => (
            <div key={roleId} className="uas-source-card">
              <div className="uas-source-header">
                <span className="am-role-tag am-summary-padding">
                  {role.name}
                </span>
                <span className="am-text-muted am-summary-text-sm">
                  {Object.values(role.byModule).reduce((n, m) => n + m.actions.length, 0)} permissions
                </span>
              </div>
              <div className="uas-source-rows">
                {Object.entries(role.byModule).map(([moduleKey, mod]) => (
                  <div key={moduleKey} className="uas-source-row">
                    <span className="uas-source-module">{mod.label}</span>
                    <div className="uas-action-chips">
                      {mod.actions.sort().map((action) => (
                        <span key={action} className="uas-action-chip">{action}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Activity & Security ─────────────────────────────────
function ActivityTab({ summary }) {
  const { user, access, audit_summary } = summary;
  const risk = riskLevel(user, access);
  const loginDays = daysSince(user.last_login);

  return (
    <div className="uas-tab-body">
      {/* Login Activity */}
      <div className="uas-section">
        <h4 className="uas-section-title">Login Activity</h4>
        <div className="uas-info-grid">
          <div className="uas-info-item">
            <span className="uas-info-label">Last Login</span>
            <span className="uas-info-value">{user.last_login ? fmtDate(user.last_login) : "Never logged in"}</span>
          </div>
          <div className="uas-info-item">
            <span className="uas-info-label">Days Since Login</span>
            <span className="uas-info-value">
              {loginDays === null
                ? "Never logged in"
                : loginDays === 0
                ? "Today"
                : `${loginDays} day${loginDays === 1 ? "" : "s"} ago`}
            </span>
          </div>
          <div className="uas-info-item">
            <span className="uas-info-label">Member Since</span>
            <span className="uas-info-value">{user.created_at || "—"}</span>
          </div>
          <div className="uas-info-item">
            <span className="uas-info-label">Department</span>
            <span className="uas-info-value">{user.department || <span className="am-text-muted">—</span>}</span>
          </div>
        </div>
        <p className="uas-note am-history-margin-top">
          Detailed login history and session tracking require additional audit infrastructure not currently enabled.
        </p>
      </div>

      {/* Security & Compliance Indicators */}
      <div className="uas-section">
        <h4 className="uas-section-title">Security & Compliance Indicators</h4>
        <div className="uas-info-grid">
          <div className="uas-info-item">
            <span className="uas-info-label">Account Status</span>
            <span className={`am-badge ${user.is_active ? "am-badge--active" : "am-badge--inactive"}`}>
              {user.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="uas-info-item">
            <span className="uas-info-label">Access Risk Level</span>
            <span
              style={{
                display: "inline-block",
                padding: "2px 10px",
                borderRadius: 12,
                fontSize: "0.75rem",
                fontWeight: 700,
                background: risk.bg,
                color: risk.color,
                border: `1px solid ${risk.color}40`,
              }}
            >
              {risk.level}
            </span>
          </div>
          <div className="uas-info-item">
            <span className="uas-info-label">Roles Assigned</span>
            <span className="uas-info-value">
              {(user.roles || []).length > 0
                ? `${user.roles.length} role${user.roles.length === 1 ? "" : "s"}`
                : <span style={{ color: "#d97706" }}>No roles assigned</span>}
            </span>
          </div>
          <div className="uas-info-item">
            <span className="uas-info-label">Last Permission Change</span>
            <span className="uas-info-value">
              {audit_summary.last_change ? fmtDate(audit_summary.last_change) : "No changes recorded"}
            </span>
          </div>
          <div className="uas-info-item">
            <span className="uas-info-label">Total Access Changes</span>
            <span className="uas-info-value">{audit_summary.total_changes}</span>
          </div>
          <div className="uas-info-item">
            <span className="uas-info-label">System Role</span>
            <span className="am-role-tag">{user.role === "admin" ? "Admin" : "Customer"}</span>
          </div>
        </div>
      </div>

      {/* Risk Explanation */}
      <div
        className="uas-risk-explain"
        style={{ background: risk.bg, border: `1px solid ${risk.color}30`, borderRadius: 8, padding: "12px 16px" }}
      >
        <span style={{ fontWeight: 700, color: risk.color, marginRight: 8 }}>{risk.level} Risk</span>
        <span style={{ fontSize: "0.82rem", color: "#374151" }}>
          {risk.level === "Low" && "User is active, has assigned roles, and has logged in recently."}
          {risk.level === "Medium" && (loginDays === null
            ? "User has never logged in — verify account is still required."
            : "User has not logged in for more than 30 days. Review if access is still needed.")}
          {risk.level === "High" && (!user.is_active
            ? "Account is inactive. No system access is possible."
            : "No effective permissions — user cannot access any application features.")}
        </span>
      </div>
    </div>
  );
}

// ─── Tab: Access History ──────────────────────────────────────
function AccessHistoryTab({ userId }) {
  const { authHeader } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [page,    setPage]    = useState(1);

  // Filters audit logs to only entries where this user is the target.
  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await auditApi.getLogs({ target_user_id: userId, page: p, limit: 10 }, authHeader());
      setData(res);
      setPage(p);
    } catch {
      // Silently show empty state rather than blocking the whole modal on audit failure.
      setData({ logs: [], total: 0, page: 1, limit: 10 });
    } finally {
      setLoading(false);
    }
  }, [userId, authHeader]);

  // Defer the audit API call until the user explicitly opens this tab.
  if (!data && !loading) {
    return (
      <div className="uas-tab-body" style={{ textAlign: "center", padding: "32px 0" }}>
        <p className="am-text-muted" style={{ marginBottom: 16 }}>
          Access change history is loaded on demand to keep the page fast.
        </p>
        <button className="am-btn am-btn--primary" onClick={() => load(1)}>
          Load Access History
        </button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="uas-tab-body" style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
        Loading access history…
      </div>
    );
  }

  const totalPages = Math.ceil((data?.total || 0) / 10) || 1;

  return (
    <div className="uas-tab-body">
      <div className="am-table-wrap">
        <table className="am-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Performed By</th>
              <th>Changes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="am-table-loading">Loading…</td></tr>
            ) : !data?.logs?.length ? (
              <tr><td colSpan={4} className="am-table-empty">No access history found for this user.</td></tr>
            ) : (
              data.logs.map((log) => (
                <tr key={log.id}>
                  <td className="am-text-muted" style={{ whiteSpace: "nowrap", fontSize: "12px" }}>
                    {fmtDate(log.created_at)}
                  </td>
                  <td><ActionBadge action={log.action} /></td>
                  <td>
                    {log.performed_by_name
                      ? <span className="am-user-cell" style={{ gap: 6 }}>
                          <span className="am-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>
                            {log.performed_by_name.charAt(0).toUpperCase()}
                          </span>
                          {log.performed_by_name}
                        </span>
                      : <span className="am-text-muted">System</span>}
                  </td>
                  <td>
                    <HistoryChangeSummary action={log.action} oldValue={log.old_value} newValue={log.new_value} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="am-pagination">
          <button disabled={page <= 1 || loading} onClick={() => load(page - 1)} className="am-btn am-btn--xs am-btn--ghost">← Prev</button>
          <span className="am-page-info">Page {page} of {totalPages} ({data?.total} entries)</span>
          <button disabled={page >= totalPages || loading} onClick={() => load(page + 1)} className="am-btn am-btn--xs am-btn--ghost">Next →</button>
        </div>
      )}
    </div>
  );
}

function HistoryChangeSummary({ action, oldValue, newValue }) {
  if (!oldValue && !newValue) return <span className="am-text-muted">—</span>;
  if (action === "USER_ROLES_UPDATED") {
    const oldRoles = oldValue?.roles ?? [];
    const newRoles = newValue?.roles ?? [];
    return (
      <div style={{ fontSize: "11px", lineHeight: "1.5" }}>
        {oldRoles.length > 0 && <div style={{ color: "#dc2626" }}>− {oldRoles.join(", ")}</div>}
        {newRoles.length > 0 && <div style={{ color: "#16a34a" }}>+ {newRoles.join(", ")}</div>}
        {newRoles.length === 0 && <div style={{ color: "#6b7280" }}>All roles removed</div>}
      </div>
    );
  }
  const combined = { ...oldValue, ...newValue };
  return (
    <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
      {Object.entries(combined).map(([key]) => (
        <div key={key}>
          <span style={{ color: "#6b7280" }}>{key}: </span>
          {oldValue?.[key] !== undefined && (
            <span style={{ color: "#dc2626", textDecoration: "line-through", marginRight: 4 }}>
              {String(oldValue[key])}
            </span>
          )}
          {newValue?.[key] !== undefined && (
            <span style={{ color: "#16a34a" }}>{String(newValue[key])}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function UserAccessSummary({ user, onClose }) {
  const { authHeader } = useAuth();
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeTab,  setActiveTab]  = useState("overview");

  // Cancellation flag prevents setState calls if the modal is closed mid-fetch.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    rbacApi.getUserAccessSummary(user.id, authHeader())
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch((e)   => { if (!cancelled) setError(e.message); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user.id]);

  const ctMeta = CUSTOMER_TYPE_META[user.customer_type] || CUSTOMER_TYPE_META["Employee"];

  return (
    <div className="am-modal-overlay" onClick={onClose}>
      <div className="am-modal am-modal--xl" onClick={(e) => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="am-modal-header">
          <h3>User Access Summary</h3>
          <button className="am-modal-close" onClick={onClose}>×</button>
        </div>

        {loading && (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#9ca3af" }}>
            Loading summary…
          </div>
        )}

        {error && (
          <div style={{ padding: "40px 22px" }}>
            <div className="am-form-error">Failed to load summary: {error}</div>
          </div>
        )}

        {!loading && !error && summary && (
          <>
            {/* User Profile Header */}
            <div className="uas-profile-header">
              {summary.user.avatar_url ? (
                <img
                  src={summary.user.avatar_url}
                  alt={summary.user.full_name}
                  className="uas-avatar-lg"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className="uas-avatar-lg">
                  {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div className="uas-profile-info">
                <div className="uas-profile-name-row">
                  <span className="uas-profile-name">{user.full_name}</span>
                  <span className={`am-badge ${user.is_active ? "am-badge--active" : "am-badge--inactive"}`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className={`am-pill ${ctMeta.cls}`}>{ctMeta.label}</span>
                  {summary.access.is_admin && (
                    <span className="uas-admin-badge">Admin</span>
                  )}
                </div>
                <div className="uas-profile-meta">
                  <span>{user.email}</span>
                  {user.department && <span>· {user.department}</span>}
                  {user.phone && <span>· {user.phone}</span>}
                </div>
                <div className="uas-profile-meta" style={{ marginTop: 2 }}>
                  <span>Member since {user.created_at}</span>
                  {user.last_login && <span>· Last login {fmtDate(user.last_login)}</span>}
                </div>
                {(user.roles || []).length > 0 && (
                  <div className="am-roles-list" style={{ marginTop: 6 }}>
                    {user.roles.map((r) => (
                      <span key={r.id} className="am-role-tag">{r.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="uas-stats-row">
              <StatCard
                value={summary.access.is_admin ? summary.all_modules.length : [...new Set(summary.access.permissions.map((p) => p.module_key))].length}
                label="Modules"
              />
              <StatCard
                value={summary.access.is_admin ? summary.all_menus.length : summary.access.menus.length}
                label="Menus"
              />
              <StatCard
                value={summary.access.is_admin ? summary.all_pages.length : summary.access.pages.length}
                label="Pages"
              />
              <StatCard value={(user.roles || []).length} label="RBAC Roles" />
              <StatCard
                value={summary.access.is_admin
                  ? summary.all_modules.length * PERM_ACTIONS.length
                  : summary.access.permissions.length}
                label="Permissions"
              />
              <StatCard value={summary.audit_summary.total_changes} label="Access Changes" />
            </div>

            {/* Inner Tabs */}
            <div className="uas-inner-tabs">
              {SUMMARY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`am-tab ${activeTab === tab.id ? "am-tab--active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="uas-content">
              {activeTab === "overview"    && <OverviewTab    summary={summary} />}
              {activeTab === "permissions" && <PermissionsTab summary={summary} />}
              {activeTab === "activity"    && <ActivityTab    summary={summary} />}
              {activeTab === "history"     && <AccessHistoryTab userId={user.id} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
