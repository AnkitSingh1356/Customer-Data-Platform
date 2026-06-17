import { useState } from "react";

// Maps a DQI severity string to a CSS modifier class for badge coloring.
const severityClass = (s = "") => {
  const v = s.toLowerCase();
  if (v === "high")   return "dqi-high";
  if (v === "medium") return "dqi-medium";
  return "dqi-low";
};

/* ── Dealer Affiliations ──────────────────────────────────────── */
const DealerAffiliations = ({ items }) => (
  <section className="vp-section">
    <h3 className="vp-section-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
      Dealer Affiliations ({items.length})
    </h3>
    {items.length === 0 ? (
      <p className="vp-empty-text">No dealer affiliations.</p>
    ) : (
      <div className="vp-affiliation-list">
        {items.map((a, i) => (
          <div key={i} className="vp-affiliation-row">
            <div>
              <p className="vp-aff-name">{a.dealer_name}</p>
              <p className="vp-aff-meta">
                {[a.dealer_code, a.region].filter(Boolean).join(" \u2022 ")}
              </p>
            </div>
            <span className="vp-aff-role">{a.role || "—"}</span>
          </div>
        ))}
      </div>
    )}
  </section>
);

/* ── Data Quality Issues ─────────────────────────────────────── */
const DataQualityIssues = ({ items }) => (
  <section className="vp-section">
    <h3 className="vp-section-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      Open Data Quality Issues ({items.length})
    </h3>
    {items.length === 0 ? (
      <p className="vp-empty-text">No open issues.</p>
    ) : (
      <div className="vp-dqi-list">
        {items.map((issue, i) => (
          <div key={i} className="vp-dqi-row">
            <div>
              <p className="vp-dqi-title">{issue.title}</p>
              {issue.description && <p className="vp-dqi-desc">{issue.description}</p>}
            </div>
            <span className={`vp-dqi-badge ${severityClass(issue.severity)}`}>
              {(issue.severity || "MEDIUM").toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    )}
  </section>
);

/* ── Flexible Attributes ─────────────────────────────────────── */
// Predefined attribute categories assignable when adding a new entry.
const ATTR_TYPES = ["Behavioral", "Demographic", "Transactional", "Custom"];

const FlexibleAttributes = ({ items, onAdd }) => {
  const [attrType, setAttrType]   = useState("Behavioral");
  const [attrKey,  setAttrKey]    = useState("");
  const [attrVal,  setAttrVal]    = useState("");
  const [saving,   setSaving]     = useState(false);

  const handleAdd = async () => {
    if (!attrKey.trim() || !attrVal.trim()) return;
    setSaving(true);
    await onAdd({ attr_type: attrType, attr_key: attrKey.trim(), attr_value: attrVal.trim() });
    setAttrKey("");
    setAttrVal("");
    setSaving(false);
  };

  return (
    <section className="vp-section">
      <h3 className="vp-section-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
        Flexible Attributes ({items.length})
      </h3>

      <div className="vp-flex-attr-add">
        <select
          className="vp-attr-type-select"
          value={attrType}
          onChange={(e) => setAttrType(e.target.value)}
        >
          {ATTR_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input
          className="vp-attr-input"
          placeholder="Key"
          value={attrKey}
          onChange={(e) => setAttrKey(e.target.value)}
        />
        <input
          className="vp-attr-input"
          placeholder="Value"
          value={attrVal}
          onChange={(e) => setAttrVal(e.target.value)}
        />
        <button
          className="vp-attr-add-btn"
          onClick={handleAdd}
          disabled={saving || !attrKey.trim() || !attrVal.trim()}
          aria-label="Add attribute"
        >
          +
        </button>
      </div>

      {items.length === 0 ? (
        <p className="vp-empty-text vp-attr-empty">No attributes yet</p>
      ) : (
        <div className="vp-attr-list">
          {items.map((a, i) => (
            <div key={i} className="vp-attr-row">
              <span className="vp-attr-type">{a.attr_type}</span>
              <span className="vp-attr-key">{a.attr_key}</span>
              <span className="vp-attr-val">{a.attr_value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

/* ── Tags ─────────────────────────────────────────────────────── */
const ProfileTags = ({ tags = [] }) =>
  tags.length > 0 ? (
    <div className="vp-tags">
      {tags.map((t, i) => (
        <span key={i} className="vp-tag">{t}</span>
      ))}
    </div>
  ) : null;

// Composes all supplementary profile sections below the core details grid.
// Each sub-section defaults to an empty array so missing API fields render safely.
const ProfileSections = ({ profile, onAdd }) => (
  <>
    <DealerAffiliations items={profile.dealer_affiliations || []} />
    <DataQualityIssues  items={profile.data_quality_issues  || []} />
    <FlexibleAttributes items={profile.flexible_attributes  || []} onAdd={onAdd} />
    <ProfileTags tags={profile.tags || []} />
  </>
);

export default ProfileSections;
