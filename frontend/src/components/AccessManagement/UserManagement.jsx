// User management panel: create/edit users, assign RBAC roles, toggle
// active status, and open the full UserAccessSummary modal.
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { rbacApi } from "../../services/rbacService";
import UserAccessSummary from "./UserAccessSummary";

const CUSTOMER_TYPES = ["Dealer", "B2B Customer", "B2C Customer", "Employee"];

const EMPTY_FORM = {
  full_name: "", email: "", password: "",
  account_type: "admin",   
  role: "admin",
  customer_type: "Employee",
  department: "", phone: "",
};

// Maps the API user object to form state, deriving account_type from the system role field.
function toFormInitial(user) {
  if (!user) return EMPTY_FORM;
  return {
    ...user,
    account_type: user.role === "admin" ? "admin" : "customer",
  };
}

function Badge({ active }) {
  return (
    <span className={`am-badge ${active ? "am-badge--active" : "am-badge--inactive"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function UserAvatar({ user, size = 30 }) {
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <span className="am-avatar" style={size !== 30 ? { width: size, height: size, fontSize: size * 0.36 } : undefined}>
      {user.full_name?.charAt(0)?.toUpperCase()}
    </span>
  );
}

function CustomerTypePill({ type }) {
  const cls = {
    "Dealer":       "am-pill--dealer",
    "B2B Customer": "am-pill--b2b",
    "B2C Customer": "am-pill--b2c",
    "Employee":     "am-pill--employee",
  }[type] || "am-pill--employee";
  return <span className={`am-pill ${cls}`}>{type}</span>;
}

function UserModal({ mode, initial, allRoles, onSave, onClose, loading }) {
  const [form, setForm]   = useState(() => toFormInitial(initial));
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const isCustomer = form.account_type === "customer";

  // Switching account type syncs the system role field and resets customer_type
  // so admin users don't carry a customer-specific type.
  const handleAccountTypeChange = (v) => {
    setForm((f) => ({
      ...f,
      account_type:  v,
      role:          v === "admin" ? "admin" : "customer",
      customer_type: v === "admin" ? "Employee" : (f.customer_type === "Employee" ? "Dealer" : f.customer_type),
    }));
  };

  const validate = () => {
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.email.trim())     return "Email is required.";
    if (mode === "create" && form.password.length < 8)
      return "Password must be at least 8 characters.";
    return "";
  };

  const handleSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    const { account_type, ...payload } = form; // account_type is UI-only; role carries the value
    if (mode === "edit") delete payload.password; // password changes require a separate flow
    onSave(payload);
  };

  return (
    <div className="am-modal-overlay" onClick={onClose}>
      <div className="am-modal" onClick={(e) => e.stopPropagation()}>
        <div className="am-modal-header">
          <h3>{mode === "create" ? "Add User" : "Edit User"}</h3>
          <button className="am-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="am-modal-body">
          {error && <div className="am-form-error">{error}</div>}
          <div className="am-form-row">
            <div className="am-form-field">
              <label>Full Name *</label>
              <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="am-form-field">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@example.com" />
            </div>
          </div>
          {mode === "create" && (
            <div className="am-form-field">
              <label>Password *</label>
              <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 8 characters" />
            </div>
          )}
          <div className="am-form-row">
            <div className="am-form-field">
              <label>Account Type</label>
              <select value={form.account_type} onChange={(e) => handleAccountTypeChange(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            {isCustomer && (
              <div className="am-form-field">
                <label>Customer Type</label>
                <select value={form.customer_type} onChange={(e) => set("customer_type", e.target.value)}>
                  {CUSTOMER_TYPES.filter((t) => t !== "Employee").map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="am-form-row">
            <div className="am-form-field">
              <label>Department</label>
              <input value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="e.g. Marketing" />
            </div>
            <div className="am-form-field">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 000 0000" />
            </div>
          </div>
        </div>
        <div className="am-modal-footer">
          <button className="am-btn am-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="am-btn am-btn--primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : mode === "create" ? "Create User" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignRolesModal({ user, allRoles, onSave, onClose, loading }) {
  const [selected, setSelected] = useState(() => new Set((user.roles || []).map((r) => r.id)));

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="am-modal-overlay" onClick={onClose}>
      <div className="am-modal am-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="am-modal-header">
          <h3>Assign Roles — {user.full_name}</h3>
          <button className="am-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="am-modal-body">
          <p className="am-modal-hint">Select RBAC roles to assign to this user.</p>
          <div className="am-checklist">
            {allRoles.map((r) => (
              <label key={r.id} className="am-checklist-item">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                />
                <span className="am-checklist-label">
                  <strong>{r.name}</strong>
                  {r.description && <span className="am-checklist-desc"> — {r.description}</span>}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="am-modal-footer">
          <button className="am-btn am-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="am-btn am-btn--primary"
            onClick={() => onSave([...selected])}
            disabled={loading}
          >
            {loading ? "Saving…" : "Save Roles"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const { authHeader } = useAuth();

  const [data,    setData]    = useState({ users: [], total: 0, page: 1, limit: 15 });
  const [allRoles, setAllRoles] = useState([]);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("");
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  // Discriminated union: type drives which modal renders; user carries the target record.
  const [modal,   setModal]   = useState(null); // { type: 'create'|'edit'|'roles'|'summary', user? }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Roles are fetched separately so the AssignRolesModal can render without
  // waiting for the paginated user list to complete.
  const loadRoles = useCallback(async () => {
    try {
      const res = await rbacApi.getRoles({ limit: 100 }, authHeader());
      setAllRoles(res.roles || []);
    } catch { /* non-critical — role list is only needed when assigning */ }
  }, [authHeader]);

  const loadUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await rbacApi.getUsers(
        { page, limit: 15, search, customer_type: filter },
        authHeader()
      );
      setData(res);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, filter, authHeader]);

  useEffect(() => { loadUsers(1); loadRoles(); }, [loadUsers, loadRoles]);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await rbacApi.createUser(payload, authHeader());
      showToast("User created successfully.");
      setModal(null);
      loadUsers(1);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleEdit = async (payload) => {
    setSaving(true);
    try {
      await rbacApi.updateUser(modal.user.id, payload, authHeader());
      showToast("User updated.");
      setModal(null);
      loadUsers(data.page);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleToggleStatus = async (user) => {
    try {
      await rbacApi.toggleUserStatus(user.id, authHeader());
      showToast(`User ${user.is_active ? "deactivated" : "activated"}.`);
      loadUsers(data.page);
    } catch (e) { showToast(e.message, "error"); }
  };

  const handleAssignRoles = async (roleIds) => {
    setSaving(true);
    try {
      await rbacApi.assignUserRoles(modal.user.id, roleIds, authHeader());
      showToast("Roles updated.");
      setModal(null);
      loadUsers(data.page);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const totalPages = Math.ceil(data.total / data.limit) || 1;

  return (
    <div className="am-section">
      {toast && <div className={`am-toast am-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="am-toolbar">
        <div className="am-toolbar-left">
          <input
            className="am-search"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="am-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Customer Types</option>
            {CUSTOMER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button className="am-btn am-btn--primary" onClick={() => setModal({ type: "create" })}>
          + Add User
        </button>
      </div>

      <div className="am-table-wrap">
        <table className="am-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>System Role</th>
              <th>Customer Type</th>
              <th>RBAC Roles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="am-table-loading">Loading…</td></tr>
            ) : data.users.length === 0 ? (
              <tr><td colSpan={7} className="am-table-empty">No users found.</td></tr>
            ) : (
              data.users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="am-user-cell">
                      <UserAvatar user={u} />
                      <span>{u.full_name}</span>
                    </div>
                  </td>
                  <td className="am-text-muted">{u.email}</td>
                  <td>
                    <span className="am-role-tag">
                      {u.role === "admin" ? "Admin" : "Customer"}
                    </span>
                  </td>
                  <td>
                    {u.role !== "admin"
                      ? <CustomerTypePill type={u.customer_type} />
                      : <span className="am-text-muted">—</span>}
                  </td>
                  <td>
                    <div className="am-roles-list">
                      {(u.roles || []).map((r) => (
                        <span key={r.id} className="am-role-tag am-role-tag--sm">{r.name}</span>
                      ))}
                      {(!u.roles || u.roles.length === 0) && <span className="am-text-muted">—</span>}
                    </div>
                  </td>
                  <td><Badge active={u.is_active !== false} /></td>
                  <td>
                    <div className="am-action-btns">
                      <button className="am-btn am-btn--xs am-btn--ghost"
                        onClick={() => setModal({ type: "edit", user: u })}>Edit</button>
                      <button className="am-btn am-btn--xs am-btn--ghost"
                        onClick={() => setModal({ type: "roles", user: u })}>Roles</button>
                      <button className="am-btn am-btn--xs am-btn--ghost"
                        onClick={() => setModal({ type: "summary", user: u })}>Summary</button>
                      <button
                        className={`am-btn am-btn--xs ${u.is_active !== false ? "am-btn--danger-ghost" : "am-btn--ghost"}`}
                        onClick={() => handleToggleStatus(u)}
                      >
                        {u.is_active !== false ? "Deactivate" : "Activate"}
                      </button>
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
          <button disabled={data.page <= 1} onClick={() => loadUsers(data.page - 1)} className="am-btn am-btn--xs am-btn--ghost">← Prev</button>
          <span className="am-page-info">Page {data.page} of {totalPages}</span>
          <button disabled={data.page >= totalPages} onClick={() => loadUsers(data.page + 1)} className="am-btn am-btn--xs am-btn--ghost">Next →</button>
        </div>
      )}

      {modal?.type === "create" && (
        <UserModal mode="create" allRoles={allRoles} onSave={handleCreate} onClose={() => setModal(null)} loading={saving} />
      )}
      {modal?.type === "edit" && (
        <UserModal mode="edit" initial={modal.user} allRoles={allRoles} onSave={handleEdit} onClose={() => setModal(null)} loading={saving} />
      )}
      {modal?.type === "roles" && (
        <AssignRolesModal user={modal.user} allRoles={allRoles} onSave={handleAssignRoles} onClose={() => setModal(null)} loading={saving} />
      )}
      {modal?.type === "summary" && (
        <UserAccessSummary user={modal.user} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
