/**
 * Displays a single KPI metric card with an optional icon, trend indicator, and subtitle.
 * Usage: Use in dashboard KPI rows to surface summary metrics at a glance.
 * @param {Object} props
 * @param {React.ReactNode} [props.icon] - Optional icon element displayed at the top of the card
 * @param {string} props.label - KPI label text (e.g. "TOTAL SESSIONS")
 * @param {string|number} props.value - Primary metric value to display prominently
 * @param {string} [props.sub] - Optional subtitle or secondary metric below the value
 * @param {string} [props.trend] - Optional trend text (e.g. "+12%")
 * @param {"up"|"down"} [props.trendType="up"] - Controls CSS colour class: "up" = green, "down" = red
 * @param {string} [props.className=""] - Additional CSS class applied to the card wrapper
 * @returns {JSX.Element}
 */
const KpiCard = ({
    icon,
    label,
    value,
    sub,
    trend,
    trendType = "up",
    className = "",
  }) => {
    return (
      <div className={`kpi-card ${className}`}>
        <div className="kpi-top">
          {icon && (
            <span className="kpi-icon">
              {icon}
            </span>
          )}
  
          <span className="kpi-label">
            {label}
          </span>
        </div>
  
        <div className="kpi-value-row">
          <div className="kpi-value">
            {value}
          </div>
  
          {trend && (
            <span className={`kpi-trend ${trendType}`}>
              {trend}
            </span>
          )}
        </div>
  
        {sub && (
          <div className="kpi-sub">
            {sub}
          </div>
        )}
      </div>
    );
  };
  
  export default KpiCard;
