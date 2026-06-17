// Manages application modules — the top-level groupings that own permissions.
// Creating a module auto-provisions the 6 standard CRUD+export+import permissions.
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { rbacApi } from "../../services/rbacService";

const EMPTY_FORM = { key: "", label: "", icon: "", sort_order: 0 };

function ModuleModal({ mode, initial, onSave, onClose, loading }) {
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
          <h3>{mode === "create" ? "Add Module" : "Edit Module"}</h3>
          <button className="am-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="am-modal-body">
          {error && <div className="am-form-error">{error}</div>}
          <div className="am-form-row">
            <div className="am-form-field">
              <label>Key * <span className="am-label-hint">(unique slug)</span></label>
              <input
                value={form.key}
                // Enforce slug format; key is immutable after creation to preserve FK integrity.
            onChange={(e) => set("key", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="e.g. my-module"
                disabled={mode === "edit"}
              />
            </div>
            <div className="am-form-field">
              <label>Label *</label>
              <input value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. My Module" />
            </div>
          </div>
          <div className="am-form-row">
            <div className="am-form-field">
              <label>Icon Key</label>
              <input value={form.icon || ""} onChange={(e) => set("icon", e.target.value)} placeholder="e.g. customer360" />
            </div>
            <div className="am-form-field">
              <label>Sort Order</label>
              <input type="number" value={form.sort_order || 0} onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)} />
            </div>
          </div>
          {mode === "create" && (
            <p className="am-modal-hint">Standard permissions (create, read, update, delete, export, import) will be created automatically.</p>
          )}
        </div>
        <div className="am-modal-footer">
          <button className="am-btn am-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="am-btn am-btn--primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : mode === "create" ? "Add Module" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ModuleManagement() {
  const { authHeader } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [modal,   setModal]   = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadModules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rbacApi.getModules(authHeader());
      setModules(res);
    } catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [authHeader]);

  useEffect(() => { loadModules(); }, [loadModules]);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await rbacApi.createModule(payload, authHeader());
      showToast("Module created.");
      setModal(null);
      loadModules();
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleEdit = async (payload) => {
    setSaving(true);
    try {
      await rbacApi.updateModule(modal.mod.id, payload, authHeader());
      showToast("Module updated.");
      setModal(null);
      loadModules();
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  // Toggling a module hides it from the permission matrix without deleting its permissions.
  const handleToggle = async (mod) => {
    try {
      await rbacApi.toggleModuleStatus(mod.id, authHeader());
      showToast(`Module ${mod.is_active ? "disabled" : "enabled"}.`);
      loadModules();
    } catch (e) { showToast(e.message, "error"); }
  };

  return (
    <div className="am-section">
      {toast && <div className={`am-toast am-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="am-toolbar">
        <div className="am-toolbar-left">
          <p className="am-section-hint">Manage application modules and their availability.</p>
        </div>
        <button className="am-btn am-btn--primary" onClick={() => setModal({ type: "create" })}>
          + Add Module
        </button>
      </div>

      <div className="am-table-wrap">
        <table className="am-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Label</th>
              <th style={{ width: 80 }}>Order</th>
              <th style={{ width: 100 }}>Permissions</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ width: 130 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="am-table-loading">Loading…</td></tr>
            ) : modules.length === 0 ? (
              <tr><td colSpan={6} className="am-table-empty">No modules found.</td></tr>
            ) : (
              modules.map((m) => (
                <tr key={m.id}>
                  <td><code className="am-code">{m.key}</code></td>
                  <td><strong>{m.label}</strong></td>
                  <td className="am-text-center">{m.sort_order}</td>
                  <td className="am-text-center">
                    <span className="am-count-badge">{m.permission_count}</span>
                  </td>
                  <td>
                    <span className={`am-badge ${m.is_active ? "am-badge--active" : "am-badge--inactive"}`}>
                      {m.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <div className="am-action-btns">
                      <button className="am-btn am-btn--xs am-btn--ghost"
                        onClick={() => setModal({ type: "edit", mod: m })}>Edit</button>
                      <button
                        className={`am-btn am-btn--xs ${m.is_active ? "am-btn--danger-ghost" : "am-btn--ghost"}`}
                        onClick={() => handleToggle(m)}
                      >
                        {m.is_active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal?.type === "create" && (
        <ModuleModal mode="create" onSave={handleCreate} onClose={() => setModal(null)} loading={saving} />
      )}
      {modal?.type === "edit" && (
        <ModuleModal mode="edit" initial={modal.mod} onSave={handleEdit} onClose={() => setModal(null)} loading={saving} />
      )}
    </div>
  );
}
