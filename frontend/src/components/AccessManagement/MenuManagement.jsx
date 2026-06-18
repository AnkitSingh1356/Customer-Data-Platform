// Dual-panel component: assign menu visibility per role (left) and manage
// the global menu item catalogue (right).
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { rbacApi } from "../../services/rbacService";
import { useToast } from "../../hooks/useToast";

const EMPTY_FORM = { key: "", label: "", icon: "", parent_key: "", sort_order: 0 };

function MenuModal({ mode, initial, allMenus, onSave, onClose, loading }) {
  const [form, setForm]   = useState(initial ?? EMPTY_FORM);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.key.trim() || !form.label.trim()) {
      setError("Key and Label are required.");
      return;
    }
    setError("");
    onSave(form);
  };

  return (
    <div className="am-modal-overlay" onClick={onClose}>
      <div className="am-modal am-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="am-modal-header">
          <h3>{mode === "create" ? "Add Menu Item" : "Edit Menu Item"}</h3>
          <button className="am-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="am-modal-body">
          {error && <div className="am-form-error">{error}</div>}
          <div className="am-form-row">
            <div className="am-form-field">
              <label>Key *</label>
              <input
                value={form.key}
                // Enforce slug format; key is immutable after creation (used as DB FK).
            onChange={(e) => set("key", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="e.g. my-page"
                disabled={mode === "edit"}
              />
            </div>
            <div className="am-form-field">
              <label>Label *</label>
              <input value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. My Page" />
            </div>
          </div>
          <div className="am-form-row">
            <div className="am-form-field">
              <label>Parent Key</label>
              <select value={form.parent_key || ""} onChange={(e) => set("parent_key", e.target.value)}>
                <option value="">None (top-level)</option>
                {allMenus.filter((m) => m.key !== form.key).map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="am-form-field">
              <label>Sort Order</label>
              <input type="number" value={form.sort_order || 0} onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="am-form-field">
            <label>Icon Key</label>
            <input value={form.icon || ""} onChange={(e) => set("icon", e.target.value)} placeholder="e.g. dashboard" />
          </div>
        </div>
        <div className="am-modal-footer">
          <button className="am-btn am-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="am-btn am-btn--primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : mode === "create" ? "Add Menu" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenuManagement() {
  const { authHeader } = useAuth();

  const [roles,        setRoles]        = useState([]);
  const [menus,        setMenus]        = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleData,     setRoleData]     = useState(null);
  // Set of menu IDs currently granted to the selected role.
  const [checkedKeys,  setCheckedKeys]  = useState(new Set());
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  // Tracks unsaved checkbox changes so the Save button stays disabled when clean.
  const [dirty,        setDirty]        = useState(false);
  const { toast, showToast } = useToast();
  const [modal,        setModal]        = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [r, m] = await Promise.all([
          rbacApi.getRoles({ limit: 100 }, authHeader()),
          rbacApi.getMenus(authHeader()),
        ]);
        setRoles(r.roles || []);
        setMenus(m);
        if ((r.roles || []).length > 0) setSelectedRole(String(r.roles[0].id));
      } catch (e) { showToast(e.message, "error"); }
    };
    load();
  }, [authHeader, showToast]);

  // Re-fetches the role's current menu assignments whenever the selected role changes.
  const loadRoleMenus = useCallback(async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const rd = await rbacApi.getRole(selectedRole, authHeader());
      setRoleData(rd);
      // Seed checkbox state from server; resets dirty flag.
      setCheckedKeys(new Set(rd.menus.map((m) => m.id)));
      setDirty(false);
    } catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [selectedRole, authHeader, showToast]);

  useEffect(() => { loadRoleMenus(); }, [loadRoleMenus]);

  const toggle = (menuId) => {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      next.has(menuId) ? next.delete(menuId) : next.add(menuId);
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await rbacApi.setRoleMenus(selectedRole, [...checkedKeys], authHeader());
      showToast("Menu visibility saved.");
      setDirty(false);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  // After create/edit, refresh the full menu list to reflect ordering changes.
  const handleCreateMenu = async (payload) => {
    setSaving(true);
    try {
      await rbacApi.createMenu(payload, authHeader());
      showToast("Menu item created.");
      setModal(null);
      const m = await rbacApi.getMenus(authHeader());
      setMenus(m);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleEditMenu = async (payload) => {
    setSaving(true);
    try {
      await rbacApi.updateMenu(modal.menu.id, payload, authHeader());
      showToast("Menu item updated.");
      setModal(null);
      const m = await rbacApi.getMenus(authHeader());
      setMenus(m);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleToggleMenuActive = async (menu) => {
    try {
      await rbacApi.updateMenu(menu.id, { is_active: !menu.is_active }, authHeader());
      showToast(`Menu ${menu.is_active ? "hidden" : "shown"}.`);
      const m = await rbacApi.getMenus(authHeader());
      setMenus(m);
    } catch (e) { showToast(e.message, "error"); }
  };

  return (
    <div className="am-section">
      {toast && <div className={`am-toast am-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="am-dual-panel">
        {/* Left: Role assignment */}
        <div className="am-panel">
          <div className="am-panel-header">
            <h4>Menu Access by Role</h4>
            <div className="am-toolbar-gap">
              <select
                className="am-filter-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button
                className="am-btn am-btn--primary am-btn--sm"
                onClick={handleSave}
                disabled={!dirty || saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          <div className="am-checklist am-checklist--scroll">
            {loading ? (
              <div className="am-table-loading">Loading…</div>
            ) : (
              menus.filter((m) => m.is_active).map((menu) => (
                <label key={menu.id} className="am-checklist-item">
                  <input
                    type="checkbox"
                    checked={checkedKeys.has(menu.id)}
                    onChange={() => toggle(menu.id)}
                  />
                  <span className="am-checklist-label">
                    <strong>{menu.label}</strong>
                    <span className="am-checklist-desc"> ({menu.key})</span>
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Right: All menus management */}
        <div className="am-panel">
          <div className="am-panel-header">
            <h4>All Menu Items</h4>
            <button className="am-btn am-btn--primary am-btn--sm" onClick={() => setModal({ type: "create" })}>
              + Add Item
            </button>
          </div>
          <div className="am-table-wrap am-table-wrap--scroll">
            <table className="am-table am-table--compact">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Label</th>
                  <th style={{ width: 70 }}>Order</th>
                  <th style={{ width: 80 }}>Visible</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((m) => (
                  <tr key={m.id}>
                    <td><code className="am-code">{m.key}</code></td>
                    <td>{m.label}</td>
                    <td className="am-text-center">{m.sort_order}</td>
                    <td>
                      <span className={`am-badge ${m.is_active ? "am-badge--active" : "am-badge--inactive"}`}>
                        {m.is_active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>
                      <div className="am-action-btns">
                        <button className="am-btn am-btn--xs am-btn--ghost"
                          onClick={() => setModal({ type: "edit", menu: m })}>Edit</button>
                        <button
                          className="am-btn am-btn--xs am-btn--ghost"
                          onClick={() => handleToggleMenuActive(m)}
                        >
                          {m.is_active ? "Hide" : "Show"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal?.type === "create" && (
        <MenuModal mode="create" allMenus={menus} onSave={handleCreateMenu} onClose={() => setModal(null)} loading={saving} />
      )}
      {modal?.type === "edit" && (
        <MenuModal mode="edit" initial={modal.menu} allMenus={menus} onSave={handleEditMenu} onClose={() => setModal(null)} loading={saving} />
      )}
    </div>
  );
}
