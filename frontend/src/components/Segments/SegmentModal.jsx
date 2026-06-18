import { useState, useEffect } from "react";
import RuleBuilder, { emptyRule } from "./RuleBuilder";
import { ACTIVITY_WINDOWS } from '../../config/constants';
// Baseline form state shared by both create and edit modes
const defaultForm = () => ({
  name:            "",
  description:     "",
  status:          "active",
  activity_window: "All time",
  match_type:      "all",
  rules:           [emptyRule()],
});

const SegmentModal = ({ mode = "create", segment = null, onClose, onSubmit }) => {
  const isEdit    = mode === "edit";
  const [form,    setForm]    = useState(defaultForm());
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (isEdit && segment) {
      setForm({
        name:            segment.name            || "",
        description:     segment.description     || "",
        status:          segment.status          || "active",
        activity_window: segment.activity_window || "All time",
        match_type:      segment.match_type      || "all",
        rules:           segment.rules?.length   ? segment.rules : [emptyRule()],
      });
    }
  }, [isEdit, segment]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Segment name is required."); return; }
    setError("");
    setSaving(true);
    try {
      // Strip incomplete rule rows before sending to avoid partial-condition errors
      const cleanRules = form.rules.filter((r) => r.field && r.operator && r.value);
      await onSubmit({ ...form, rules: cleanRules });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="seg-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="seg-modal-header">
          <div>
            <h2 className="seg-modal-title">
              {isEdit ? "Edit Segment" : "Create New Segment"}
            </h2>
            <p className="seg-modal-subtitle">
              {isEdit
                ? "Update segment details and rules."
                : "Define your audience using grouped attributes and a dynamic activity window."}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="seg-modal-body">
          <div className="seg-form-group">
            <label className="seg-form-label">Segment Name <span className="seg-required">*</span></label>
            <input
              className={`seg-form-input${!isEdit ? " seg-input-focus" : ""}`}
              placeholder="e.g. High-Value Customers"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="seg-form-group">
            <label className="seg-form-label">Description</label>
            <textarea
              className="seg-form-textarea"
              placeholder="Describe the purpose of this segment..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="seg-form-group">
            <label className="seg-form-label">{isEdit ? "Status" : "Initial Status"}</label>
            <select
              className="seg-form-select"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="seg-builder-box">
            <div className="seg-activity-row">
              <span className="seg-activity-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Activity window
              </span>
              <select
                className="seg-activity-select"
                value={form.activity_window}
                onChange={(e) => set("activity_window", e.target.value)}
              >
                {ACTIVITY_WINDOWS.map((w) => <option key={w}>{w}</option>)}
              </select>
            </div>

            <div className="seg-box-divider" />

            <RuleBuilder
              rules={form.rules}
              matchType={form.match_type}
              onRulesChange={(r) => set("rules", r)}
              onMatchTypeChange={(m) => set("match_type", m)}
            />
          </div>

          {error && <p className="seg-form-error">{error}</p>}
        </div>

        <div className="seg-modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn-upload"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving
              ? <span className="btn-spinner"><span className="spinner" /> Saving…</span>
              : isEdit ? "Save Changes" : "Create Segment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SegmentModal;
