// CRUD management for RBAC roles. Supports create, edit, clone, soft-delete,
// and active/inactive toggling. Clone copies all permissions, menus, and pages.
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { rbacApi } from "../../services/rbacService";

const EMPTY_FORM = { name: "", description: "" };

function RoleModal({ mode, initial, onSave, onClose, loading }) {
  const [form, setForm]   = useState(initial ?? EMPTY_FORM);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) { setError("Role name is required."); return; }
    setError("");
    onSave(form);
  };

  return (
    <div className="am-modal-overlay" onClick={onClose}>
      <div className="am-modal am-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="am-modal-header">
          <h3>{mode === "create" ? "Create Role" : "Edit Role"}</h3>
          <button className="am-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="am-modal-body">
          {error && <div className="am-form-error">{error}</div>}
          <div className="am-form-field">
            <label>Role Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Regional Manager" />
          </div>
          <div className="am-form-field">
            <label>Description</label>
            <textarea rows={3} value={form.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="What can this role do?" />
          </div>
        </div>
        <div className="am-modal-footer">
          <button className="am-btn am-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="am-btn am-btn--primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : mode === "create" ? "Create Role" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Pre-fills the new role name with "(Copy)" suffix as a convenience default.
function CloneModal({ role, onSave, onClose, loading }) {
  const [name, setName] = useState(`${role.name} (Copy)`);
  return (
    <div className="am-modal-overlay" onClick={onClose}>
      <div className="am-modal am-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="am-modal-header">
          <h3>Clone Role — {role.name}</h3>
          <button className="am-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="am-modal-body">
          <div className="am-form-field">
            <label>New Role Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <p className="am-modal-hint">All permissions, menus, and page access will be copied.</p>
        </div>
        <div className="am-modal-footer">
          <button className="am-btn am-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="am-btn am-btn--primary" onClick={() => onSave(name)} disabled={loading}>
            {loading ? "Cloning…" : "Clone Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Deletion is blocked when users are assigned; the error copy explains why.
function DeleteConfirmModal({ role, onConfirm, onClose, loading }) {
  return (
    <div className="am-modal-overlay" onClick={onClose}>
      <div className="am-modal am-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="am-modal-header">
          <h3>Delete Role</h3>
          <button className="am-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="am-modal-body">
          <p>Are you sure you want to delete <strong>{role.name}</strong>?</p>
          {parseInt(role.user_count) > 0 && (
            <div className="am-form-error">
              This role is assigned to {role.user_count} user(s). Remove the assignments first.
            </div>
          )}
        </div>
        <div className="am-modal-footer">
          <button className="am-btn am-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="am-btn am-btn--danger"
            onClick={onConfirm}
            disabled={loading || parseInt(role.user_count) > 0}
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoleManagement() {
  const { authHeader } = useAuth();

  const [data,    setData]    = useState({ roles: [], total: 0, page: 1, limit: 20 });
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [modal,   setModal]   = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadRoles = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await rbacApi.getRoles({ page, limit: 20, search }, authHeader());
      setData(res);
    } catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [search, authHeader]);

  useEffect(() => { loadRoles(1); }, [loadRoles]);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await rbacApi.createRole(payload, authHeader());
      showToast("Role created.");
      setModal(null);
      loadRoles(1);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  // After edit, stay on the current page to avoid losing the user's scroll position.
  const handleEdit = async (payload) => {
    setSaving(true);
    try {
      await rbacApi.updateRole(modal.role.id, payload, authHeader());
      showToast("Role updated.");
      setModal(null);
      loadRoles(data.page);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await rbacApi.deleteRole(modal.role.id, authHeader());
      showToast("Role deleted.");
      setModal(null);
      loadRoles(1);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleClone = async (name) => {
    setSaving(true);
    try {
      await rbacApi.cloneRole(modal.role.id, name, authHeader());
      showToast("Role cloned.");
      setModal(null);
      loadRoles(1);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (role) => {
    try {
      await rbacApi.updateRole(role.id, { is_active: !role.is_active }, authHeader());
      showToast(`Role ${role.is_active ? "disabled" : "enabled"}.`);
      loadRoles(data.page);
    } catch (e) { showToast(e.message, "error"); }
  };

  const totalPages = Math.ceil(data.total / data.limit) || 1;

  return (
    <div className="am-section">
      {toast && <div className={`am-toast am-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="am-toolbar">
        <input
          className="am-search"
          placeholder="Search roles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="am-btn am-btn--primary" onClick={() => setModal({ type: "create" })}>
          + Create Role
        </button>
      </div>

      <div className="am-table-wrap">
        <table className="am-table">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Description</th>
              <th style={{ width: 80 }}>Users</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="am-table-loading">Loading…</td></tr>
            ) : data.roles.length === 0 ? (
              <tr><td colSpan={5} className="am-table-empty">No roles found.</td></tr>
            ) : (
              data.roles.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td className="am-text-muted">{r.description || "—"}</td>
                  <td>
                    <span className="am-count-badge">{r.user_count}</span>
                  </td>
                  <td>
                    <span className={`am-badge ${r.is_active ? "am-badge--active" : "am-badge--inactive"}`}>
                      {r.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <div className="am-action-btns">
                      <button className="am-btn am-btn--xs am-btn--ghost"
                        onClick={() => setModal({ type: "edit", role: r })}>Edit</button>
                      <button className="am-btn am-btn--xs am-btn--ghost"
                        onClick={() => setModal({ type: "clone", role: r })}>Clone</button>
                      <button
                        className={`am-btn am-btn--xs ${r.is_active ? "am-btn--ghost" : "am-btn--ghost"}`}
                        onClick={() => handleToggleActive(r)}
                      >
                        {r.is_active ? "Disable" : "Enable"}
                      </button>
                      <button className="am-btn am-btn--xs am-btn--danger-ghost"
                        onClick={() => setModal({ type: "delete", role: r })}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="am-pagination">
          <button disabled={data.page <= 1} onClick={() => loadRoles(data.page - 1)} className="am-btn am-btn--xs am-btn--ghost">← Prev</button>
          <span className="am-page-info">Page {data.page} of {totalPages}</span>
          <button disabled={data.page >= totalPages} onClick={() => loadRoles(data.page + 1)} className="am-btn am-btn--xs am-btn--ghost">Next →</button>
        </div>
      )}

      {modal?.type === "create" && (
        <RoleModal mode="create" onSave={handleCreate} onClose={() => setModal(null)} loading={saving} />
      )}
      {modal?.type === "edit" && (
        <RoleModal mode="edit" initial={modal.role} onSave={handleEdit} onClose={() => setModal(null)} loading={saving} />
      )}
      {modal?.type === "clone" && (
        <CloneModal role={modal.role} onSave={handleClone} onClose={() => setModal(null)} loading={saving} />
      )}
      {modal?.type === "delete" && (
        <DeleteConfirmModal role={modal.role} onConfirm={handleDelete} onClose={() => setModal(null)} loading={saving} />
      )}
    </div>
  );
}
