/**
 * Derives up to two uppercase initials from the customer's full name.
 * Usage: Used internally by ProfileHeader to generate the avatar fallback text.
 * @param {string} [name=""] - The customer's full name
 * @returns {string} Up to two uppercase initials (e.g. "JD" for "Jane Doe")
 */
const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

/**
 * Maps a 0-100 data quality score to a traffic-light color string.
 * Usage: Used internally by ProfileHeader to colorize the quality score indicator.
 * @param {number} score - Quality score between 0 and 100
 * @returns {string} Hex color string: green (#22c55e) for ≥80, amber (#f59e0b) for ≥50, red (#ef4444) otherwise
 */
const qualityColor = (score) => {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
};

/**
 * Displays the customer identity summary row: avatar initials, name, email, CDP ID, quality score, data owner, and primary source.
 * Usage: Rendered at the top of the customer profile modal above the details grid.
 * @param {Object} props
 * @param {Object} props.profile - Customer profile object with full_name, email, cdp_id, quality_score, data_owner, and primary_source
 * @param {function} props.onClose - Callback invoked when the close button is clicked
 * @returns {JSX.Element}
 */
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
