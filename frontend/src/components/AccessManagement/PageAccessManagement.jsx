import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { rbacApi } from "../../services/rbacService";

export default function PageAccessManagement() {
  const { authHeader } = useAuth();

  const [roles,        setRoles]        = useState([]);
  const [pages,        setPages]        = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [checkedIds,   setCheckedIds]   = useState(new Set());
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [dirty,        setDirty]        = useState(false);
  const [toast,        setToast]        = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [r, p] = await Promise.all([
          rbacApi.getRoles({ limit: 100 }, authHeader()),
          rbacApi.getPages(authHeader()),
        ]);
        setRoles(r.roles || []);
        setPages(p);
        if ((r.roles || []).length > 0) setSelectedRole(String(r.roles[0].id));
      } catch (e) { showToast(e.message, "error"); }
    };
    load();
  }, [authHeader]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRolePages = useCallback(async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const rd = await rbacApi.getRole(selectedRole, authHeader());
      setCheckedIds(new Set(rd.pages.map((p) => p.id)));
      setDirty(false);
    } catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [selectedRole, authHeader]);

  useEffect(() => { loadRolePages(); }, [loadRolePages]);

  const toggle = (pageId) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(pageId) ? next.delete(pageId) : next.add(pageId);
      return next;
    });
    setDirty(true);
  };

  const toggleAll = () => {
    const allIds = pages.map((p) => p.id);
    const allChecked = allIds.every((id) => checkedIds.has(id));
    setCheckedIds(allChecked ? new Set() : new Set(allIds));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await rbacApi.setRolePages(selectedRole, [...checkedIds], authHeader());
      showToast("Page access saved.");
      setDirty(false);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const grouped = pages.reduce((acc, p) => {
    const mod = p.module_key || "other";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

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
        <div className="am-toolbar-gap">
          <button className="am-btn am-btn--ghost am-btn--sm" onClick={toggleAll}>
            {pages.length > 0 && pages.every((p) => checkedIds.has(p.id)) ? "Deselect All" : "Select All"}
          </button>
          <button
            className="am-btn am-btn--primary"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="am-table-loading">Loading page access…</div>
      ) : (
        <div className="am-page-access-grid">
          {Object.entries(grouped).map(([moduleKey, modulePages]) => (
            <div key={moduleKey} className="am-page-group">
              <div className="am-page-group-header">{moduleKey}</div>
              {modulePages.map((p) => (
                <label key={p.id} className="am-checklist-item">
                  <input
                    type="checkbox"
                    checked={checkedIds.has(p.id)}
                    onChange={() => toggle(p.id)}
                  />
                  <span className="am-checklist-label">
                    <strong>{p.label}</strong>
                    <span className="am-checklist-desc"> /{p.route}</span>
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
