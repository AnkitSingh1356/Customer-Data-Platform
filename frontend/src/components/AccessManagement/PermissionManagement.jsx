// Permission matrix editor — assigns granular CRUD+export+import permissions
// to a role across all active modules via a checkbox grid.
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/AuthContext";
import { rbacApi } from "../../services/rbacService";
import { useToast } from "../../hooks/useToast";

// Column headers for the permission matrix; must match backend action enum values.
const STANDARD_ACTIONS = ["create", "read", "update", "delete", "export", "import"];

export default function PermissionManagement() {
  const { authHeader } = useAuth();

  const [roles,       setRoles]       = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleData,    setRoleData]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [dirty,       setDirty]       = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [r, p] = await Promise.all([
          rbacApi.getRoles({ limit: 100 }, authHeader()),
          rbacApi.getPermissions(authHeader()),
        ]);
        setRoles(r.roles || []);
        setPermissions(p);
        if ((r.roles || []).length > 0) setSelectedRole(String(r.roles[0].id));
      } catch (e) { showToast(e.message, "error"); }
    };
    load();
  }, [authHeader, showToast]);

  useEffect(() => {
    if (!selectedRole) return;
    const load = async () => {
      setLoading(true);
      try {
        const rd = await rbacApi.getRole(selectedRole, authHeader());
        setRoleData(rd);
        setDirty(false);
      } catch (e) { showToast(e.message, "error"); }
      finally { setLoading(false); }
    };
    load();
  }, [selectedRole, authHeader, showToast]);

  // Separate state so the matrix rerenders independently of roleData fetch.
  const [checkedIds, setCheckedIds] = useState(new Set());

  useEffect(() => {
    if (roleData) {
      setCheckedIds(new Set(roleData.permissions.map((p) => p.id)));
      setDirty(false);
    }
  }, [roleData]);

  // Build a module→action lookup for rendering the matrix;
  // sorted by module sort_order to match the navigation hierarchy.
  const byModule = useMemo(() => {
    const map = {};
    permissions.forEach((p) => {
      if (!map[p.module_key]) {
        map[p.module_key] = { label: p.module_label, sort_order: p.sort_order, perms: {} };
      }
      map[p.module_key].perms[p.action] = p;
    });
    return Object.entries(map).sort((a, b) => a[1].sort_order - b[1].sort_order);
  }, [permissions]);

  const toggle = (permId) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      return next;
    });
    setDirty(true);
  };

  // Row header checkbox: grants/revokes all actions for a single module at once.
  const toggleRow = (moduleKey) => {
    const modulePerms = permissions.filter((p) => p.module_key === moduleKey);
    const allChecked  = modulePerms.every((p) => checkedIds.has(p.id));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      modulePerms.forEach((p) => allChecked ? next.delete(p.id) : next.add(p.id));
      return next;
    });
    setDirty(true);
  };

  // Column header button: grants/revokes one action (e.g. "delete") across all modules.
  const toggleColumn = (action) => {
    const actionPerms = permissions.filter((p) => p.action === action);
    const allChecked  = actionPerms.every((p) => checkedIds.has(p.id));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      actionPerms.forEach((p) => allChecked ? next.delete(p.id) : next.add(p.id));
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await rbacApi.setRolePermissions(selectedRole, [...checkedIds], authHeader());
      showToast("Permissions saved.");
      setDirty(false);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="am-section">
      {toast && <div className={`am-toast am-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="am-toolbar">
        <div className="am-toolbar-left am-toolbar-gap">
          <label className="am-label-inline">Role:</label>
          <select
            className="am-filter-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <button
          className="am-btn am-btn--primary"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {loading ? (
        <div className="am-table-loading">Loading permissions…</div>
      ) : (
        <div className="am-matrix-wrap">
          <table className="am-matrix-table">
            <thead>
              <tr>
                <th className="am-matrix-module-col">Module</th>
                {STANDARD_ACTIONS.map((a) => (
                  <th key={a} className="am-matrix-action-col">
                    <button
                      className="am-matrix-col-toggle"
                      title={`Toggle all ${a}`}
                      onClick={() => toggleColumn(a)}
                    >
                      {a}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byModule.map(([moduleKey, { label, perms }]) => {
                const rowPerms = STANDARD_ACTIONS.map((a) => perms[a]).filter(Boolean);
                const allChecked = rowPerms.length > 0 && rowPerms.every((p) => checkedIds.has(p.id));
                return (
                  <tr key={moduleKey}>
                    <td className="am-matrix-module-name">
                      <label className="am-matrix-row-label">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={() => toggleRow(moduleKey)}
                          className="am-matrix-row-check"
                        />
                        {label}
                      </label>
                    </td>
                    {STANDARD_ACTIONS.map((action) => {
                      const perm = perms[action];
                      return (
                        <td key={action} className="am-matrix-cell">
                          {perm ? (
                            <input
                              type="checkbox"
                              checked={checkedIds.has(perm.id)}
                              onChange={() => toggle(perm.id)}
                              className="am-matrix-check"
                            />
                          ) : (
                            <span className="am-matrix-na">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
