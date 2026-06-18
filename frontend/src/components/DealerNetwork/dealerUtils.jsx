/**
 * Formats a revenue number as an abbreviated string (e.g. "$2.3M", "$450k").
 * Usage: Used in dealer KPI cards where horizontal space is constrained.
 * @param {number|null} n - The revenue value to format; null/undefined is treated as 0
 * @returns {string} Abbreviated formatted string (e.g. "$2.3M", "$450k", "$999")
 */
export function fmtRevenue(n) {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toLocaleString()}`;
}

/**
 * Formats a revenue number as a full locale string for table cells (e.g. "$1,234,567").
 * Usage: Used in dealer detail modals and table cells where full precision is needed.
 * @param {number|null} n - The revenue value to format; null/undefined is treated as 0
 * @returns {string} Full locale-formatted currency string (e.g. "$1,234,567")
 */
export function fmtRevenueTable(n) {
  const v = Number(n ?? 0);
  return `$${v.toLocaleString()}`;
}

/**
 * Formats a number as a locale-formatted integer string, treating null/undefined as 0.
 * Usage: Used in dealer KPI cards to display counts (e.g. "1,234").
 * @param {number|null} n - The number to format
 * @returns {string} Locale-formatted integer string (e.g. "1,234")
 */
export function fmtNum(n) {
  return Number(n ?? 0).toLocaleString();
}

/**
 * Returns the CSS modifier class for a dealer tier badge.
 * Usage: Apply the returned class to tier pill elements in dealer tables and modals.
 * @param {string} [tier=""] - Dealer tier string (e.g. "platinum", "gold", "silver")
 * @returns {string} CSS class name (e.g. "dn-tier-platinum", "dn-tier-standard" for unknown tiers)
 */
export function tierClass(tier = "") {
  const t = tier.toLowerCase();
  if (t === "platinum") return "dn-tier-platinum";
  if (t === "gold")     return "dn-tier-gold";
  if (t === "silver")   return "dn-tier-silver";
  return "dn-tier-standard";
}

/* Building icon SVG (reused inline) */
export const BuildingIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="1"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

export const PersonIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export const ChevronIcon = ({ open }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.18s" }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
