// Read-only audit log viewer for all RBAC permission change events.
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { auditApi } from "../../services/rbacService";
import { ACTION_META } from "../../config/constants";

const ALL_ACTIONS = Object.keys(ACTION_META);

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

// Renders a human-readable diff between old and new audit log values.
// Each action type has a custom layout; the generic fallback diffs all keys.
function ChangeSummary({ oldValue, newValue, action }) {
  if (!oldValue && !newValue) return <span className="am-text-muted">—</span>;

  if (action === "USER_ROLES_UPDATED") {
    const oldRoles = oldValue?.roles ?? [];
    const newRoles = newValue?.roles ?? [];
    return (
      <div className="am-change-meta">
        {oldRoles.length > 0 && <div className="am-change-text-removed">− {oldRoles.join(", ")}</div>}
        {newRoles.length > 0 && <div className="am-change-text-added">+ {newRoles.join(", ")}</div>}
        {newRoles.length === 0 && <div className="am-change-label">All roles removed</div>}
      </div>
    );
  }

  // Bulk-access changes only show item count delta to keep cells compact.
  if (["PERMISSIONS_UPDATED", "MENU_ACCESS_UPDATED", "PAGE_ACCESS_UPDATED"].includes(action)) {
    const oldItems = Object.values(oldValue ?? {})[0] ?? [];
    const newItems = Object.values(newValue ?? {})[0] ?? [];
    return (
      <span className="am-change-label">
        {oldItems.length} → {newItems.length} items
      </span>
    );
  }

  if (action === "ROLE_CLONED") {
    return (
      <span className="am-change-label">
        From "{(newValue ?? oldValue)?.cloned_from ?? "?"}"
      </span>
    );
  }

  // Generic key→value diff
  const combined = { ...oldValue, ...newValue };
  return (
    <div className="am-change-diff">
      {Object.entries(combined).map(([key]) => (
        <div key={key}>
          <span className="am-change-label">{key}: </span>
          {oldValue?.[key] !== undefined && (
            <span className="am-change-text-removed">
              {String(oldValue[key])}
            </span>
          )}
          {newValue?.[key] !== undefined && (
            <span className="am-change-text-added">{String(newValue[key])}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Client-side CSV export — downloads currently visible page of logs only.
function exportToCsv(logs) {
  const headers = ["Timestamp", "Action", "Performed By", "Target User", "Target Role", "Entity Type"];
  const rows = logs.map((l) => [
    new Date(l.created_at).toLocaleString(),
    l.action,
    l.performed_by_name ?? "",
    l.target_user_name  ?? "",
    l.target_role_name  ?? "",
    l.entity_type       ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "permission_audit_trail.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function AuditTrail() {
  const { authHeader } = useAuth();

  // Stores paginated log response; page/limit kept here to drive pagination UI.
  const [data,    setData]    = useState({ logs: [], total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(false);
  // filters.from/to are ISO date strings sent as query params for server-side filtering.
  const [filters, setFilters] = useState({ action: "", search: "", from: "", to: "" });
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await auditApi.getLogs({ ...filters, page, limit: 20 }, authHeader());
      setData(res);
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters, authHeader]);

  useEffect(() => { load(1); }, [load]);

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  // Guard against 0 total so pagination never renders 0 pages.
  const totalPages = Math.ceil(data.total / data.limit) || 1;

  return (
    <div className="am-section">
      {toast && <div className={`am-toast am-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="am-toolbar">
        <div className="am-toolbar-left am-filter-row">
          <input
            className="am-search am-filter-input-wide"
            placeholder="Search by user or role…"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
          />
          <select
            className="am-filter-select"
            value={filters.action}
            onChange={(e) => set("action", e.target.value)}
          >
            <option value="">All Actions</option>
            {ALL_ACTIONS.map((a) => (
              <option key={a} value={a}>{ACTION_META[a].label}</option>
            ))}
          </select>
          <input
            type="date"
            className="am-filter-select"
            value={filters.from}
            onChange={(e) => set("from", e.target.value)}
            title="From date"
          />
          <input
            type="date"
            className="am-filter-select"
            value={filters.to}
            onChange={(e) => set("to", e.target.value)}
            title="To date"
          />
        </div>
        <button
          className="am-btn am-btn--ghost"
          onClick={() => exportToCsv(data.logs)}
          disabled={!data.logs.length}
          title="Export visible logs to CSV"
        >
          Export CSV
        </button>
      </div>

      <div className="am-table-wrap">
        <table className="am-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Performed By</th>
              <th>Target User</th>
              <th>Target Role</th>
              <th>Changes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="am-table-loading">Loading…</td></tr>
            ) : data.logs.length === 0 ? (
              <tr><td colSpan={6} className="am-table-empty">No audit logs found.</td></tr>
            ) : (
              data.logs.map((log) => (
                <tr key={log.id}>
                  <td className="am-text-muted am-timestamp-cell">
                    {new Date(log.created_at).toLocaleString(undefined, {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
                  </td>
                  <td><ActionBadge action={log.action} /></td>
                  <td>
                    {log.performed_by_name
                      ? <span className="am-user-cell am-action-row">
                          <span className="am-avatar am-icon-btn-sm">
                            {log.performed_by_name.charAt(0).toUpperCase()}
                          </span>
                          {log.performed_by_name}
                        </span>
                      : <span className="am-text-muted">System</span>}
                  </td>
                  <td className="am-text-muted">{log.target_user_name ?? "—"}</td>
                  <td>
                    {log.target_role_name
                      ? <span className="am-role-tag am-role-tag--sm">{log.target_role_name}</span>
                      : <span className="am-text-muted">—</span>}
                  </td>
                  <td>
                    <ChangeSummary
                      action={log.action}
                      oldValue={log.old_value}
                      newValue={log.new_value}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="am-pagination">
          <button disabled={data.page <= 1} onClick={() => load(data.page - 1)} className="am-btn am-btn--xs am-btn--ghost">← Prev</button>
          <span className="am-page-info">Page {data.page} of {totalPages} ({data.total} entries)</span>
          <button disabled={data.page >= totalPages} onClick={() => load(data.page + 1)} className="am-btn am-btn--xs am-btn--ghost">Next →</button>
        </div>
      )}
    </div>
  );
}
