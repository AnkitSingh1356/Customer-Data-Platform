// Renders a labelled progress bar showing count as a percentage of total.
// "Merged" rows use a green fill to distinguish resolved from pending states.
const StatRow = ({ label, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const isGreen = label === "Merged";

  return (
    <div className="ir-stats-section">
      <div className="stats-row">
        <span>{label}</span>
        <span>
          {count} ({pct}%)
        </span>
      </div>
      <div className="stats-bar">
        <div
          className={isGreen ? "stats-fill stats-fill-green" : "stats-fill"}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const ResolutionStats = ({ dashboard }) => {
  const total = dashboard?.totalDuplicates || 0;

  return (
    <div className="identity-card">
      <h2>Resolution Statistics</h2>

      <StatRow label="Merged" count={dashboard?.profilesMerged || 0} total={total} />
      <StatRow label="Reviewed" count={dashboard?.manualReviewQueue || 0} total={total} />
      <StatRow label="Needs Review" count={dashboard?.needsReview || 0} total={total} />
      <StatRow label="Dismissed" count={dashboard?.dismissed || 0} total={total} />
    </div>
  );
};

export default ResolutionStats;
