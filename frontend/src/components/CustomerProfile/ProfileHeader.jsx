// Derives up to two uppercase initials from the customer's full name.
const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// Maps a 0-100 quality score to a traffic-light color (green/amber/red).
const qualityColor = (score) => {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
};

// Displays the customer's avatar, name, email, CDP ID, quality score,
// data owner, and primary source — the identity summary row of the modal.
const ProfileHeader = ({ profile, onClose }) => (
  <>
    <div className="vp-header">
      <div className="vp-avatar">{getInitials(profile.full_name)}</div>
      <div className="vp-header-info">
        <h2 className="vp-name">{profile.full_name}</h2>
        <p className="vp-meta">
          {profile.email}
          {profile.cdp_id && <> &bull; {profile.cdp_id}</>}
        </p>
      </div>
      <div className="vp-quality-block">
        <span className="vp-quality-score" style={{ color: qualityColor(profile.quality_score || 0) }}>
          {profile.quality_score ?? 0}
        </span>
        <span className="vp-quality-label">QUALITY</span>
      </div>
      <button className="vp-close-btn" onClick={onClose} aria-label="Close">✕</button>
    </div>

    <div className="vp-meta-row">
      <span className="vp-meta-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00b8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span className="vp-meta-key">Data Owner:</span>
        <span className="vp-meta-val">{profile.data_owner || "—"}</span>
      </span>
      <span className="vp-meta-source">
        Source: {profile.primary_source || "—"}
      </span>
    </div>
  </>
);

export default ProfileHeader;
