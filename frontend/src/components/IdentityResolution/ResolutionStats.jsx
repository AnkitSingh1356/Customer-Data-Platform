/**
 * Renders a labelled progress bar showing a count as a percentage of a total.
 * Usage: Used internally by ResolutionStats to display each resolution category.
 * "Merged" rows use a green fill to distinguish resolved from pending states.
 * @param {Object} props
 * @param {string} props.label - Category label (e.g. "Merged", "Dismissed")
 * @param {number} props.count - Count of records in this category
 * @param {number} props.total - Total records used to calculate the percentage
 * @returns {JSX.Element}
 */
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

/**
 * Displays resolution statistics as a set of labelled progress bars.
 * Usage: Render alongside the MergeQueueTable in the Identity Resolution page.
 * @param {Object} props
 * @param {Object} props.dashboard - Dashboard KPI object with totalDuplicates, profilesMerged,
 *   manualReviewQueue, needsReview, and dismissed fields
 * @returns {JSX.Element}
 */
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
