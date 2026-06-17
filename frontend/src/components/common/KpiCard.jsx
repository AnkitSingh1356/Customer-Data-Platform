// Displays a single KPI metric with optional icon, trend indicator, and subtitle.
// trendType ("up" | "down") drives CSS class for green/red colouring.
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
