// Centralized shared constants for the Customer Data Platform frontend.
// Import named exports from this file instead of duplicating these values locally.

// ─── Customer / User Types ────────────────────────────────────────────────────

// Plain string array used for filter dropdowns and option lists (UserManagement, SignupPage)
export const CUSTOMER_TYPES = ["Dealer", "B2B Customer", "B2C Customer", "Employee"];

// Portal branding shown in the welcome overlay (App.jsx)
export const CUSTOMER_TYPE_PORTALS = {
  "Dealer":       { name: "Dealer Portal",       color: "#1d4ed8" },
  "B2B Customer": { name: "B2B Customer Portal",  color: "#92400e" },
  "B2C Customer": { name: "B2C Customer Portal",  color: "#166534" },
  "Employee":     { name: "CDP Platform",         color: "#6d28d9" },
};

// Maps customer type strings to CSS pill class and display label (UserAccessSummary)
export const CUSTOMER_TYPE_META = {
  "Dealer":       { cls: "am-pill--dealer",   label: "Dealer" },
  "B2B Customer": { cls: "am-pill--b2b",      label: "B2B Customer" },
  "B2C Customer": { cls: "am-pill--b2c",      label: "B2C Customer" },
  "Employee":     { cls: "am-pill--employee", label: "Employee" },
};

// ─── RBAC / Access Management ─────────────────────────────────────────────────

// Color-coded metadata for every auditable RBAC action type (AuditTrail, UserAccessSummary)
export const ACTION_META = {
  USER_CREATED:        { label: "User Created",        color: "#16a34a" },
  USER_UPDATED:        { label: "User Updated",        color: "#2563eb" },
  USER_ACTIVATED:      { label: "User Activated",      color: "#16a34a" },
  USER_DEACTIVATED:    { label: "User Deactivated",    color: "#d97706" },
  USER_ROLES_UPDATED:  { label: "Roles Changed",       color: "#7c3aed" },
  ROLE_CREATED:        { label: "Role Created",        color: "#16a34a" },
  ROLE_UPDATED:        { label: "Role Updated",        color: "#2563eb" },
  ROLE_DELETED:        { label: "Role Deleted",        color: "#dc2626" },
  ROLE_CLONED:         { label: "Role Cloned",         color: "#0891b2" },
  PERMISSIONS_UPDATED: { label: "Permissions Updated", color: "#7c3aed" },
  MENU_ACCESS_UPDATED: { label: "Menu Access Updated", color: "#7c3aed" },
  PAGE_ACCESS_UPDATED: { label: "Page Access Updated", color: "#7c3aed" },
};

// Permission action types used in the matrix UI (UserAccessSummary, PermissionManagement)
export const PERM_ACTIONS = ["create", "read", "update", "delete", "export", "import"];

// Column headers for the permission matrix; must match backend action enum values (PermissionManagement)
export const STANDARD_ACTIONS = ["create", "read", "update", "delete", "export", "import"];

// Tab config for the UserAccessSummary inner tab bar
export const SUMMARY_TABS = [
  { id: "overview",    label: "Overview" },
  { id: "permissions", label: "Permissions" },
  { id: "activity",    label: "Activity & Security" },
  { id: "history",     label: "Access History" },
];

// ─── Segments / Rule Builder ──────────────────────────────────────────────────

// Operators available for free-text / categorical fields (RuleBuilder)
export const TEXT_OPS = [
  { value: "equals",     label: "Is" },
  { value: "not_equals", label: "Is not" },
  { value: "contains",   label: "Contains" },
];

// Operators available for numeric fields (supports range queries via "between") (RuleBuilder)
export const NUMBER_OPS = [
  { value: "equals",       label: "Is" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than",    label: "Less than" },
  { value: "between",      label: "Between" },
];

// Fields that should use numeric comparison operators instead of text operators (RuleBuilder)
export const NUMBER_FIELDS = new Set([
  "quality_score",
  "order_frequency",
  "total_spend_ltv",
  "average_order_value",
  "credit_utilization",
  "inventory_volume",
]);

// Lookback windows available for scoping behavioural rule evaluation (SegmentModal)
export const ACTIVITY_WINDOWS = [
  "All time",
  "Last 7d",
  "Last 14d",
  "Last 30d",
  "Last 60d",
  "Last 90d",
  "Last 6m",
  "Last 12m",
  "YTD",
];

// ─── Customer Profile ─────────────────────────────────────────────────────────

// Predefined attribute categories assignable when adding a flexible attribute (ProfileSections)
export const ATTR_TYPES = ["Behavioral", "Demographic", "Transactional", "Custom"];

// ─── Charts ───────────────────────────────────────────────────────────────────

// Shared chart color palette (BehavioralAnalyticsPage, ConsentCompliancePage)
export const CHART_COLORS = ["#0EA5E9", "#14B8A6", "#22C55E", "#F97316"];

// ─── Release Notes ────────────────────────────────────────────────────────────
// Icon config for release note sections.
// This constants file is .js and must remain JSX-free, so we only store
// color/theme metadata here.

export const SECTION_CONFIG = {
  Highlights:            { color: 'rgb(14,165,233)',  bg: 'rgba(14,165,233,0.08)' },
  Features:              { color: 'rgb(14,165,233)',  bg: 'rgba(14,165,233,0.06)' },
  Enhancements:          { color: 'rgb(14,165,233)',  bg: 'rgba(14,165,233,0.06)' },
  'Governance Updates':  { color: '#14b8a6',          bg: 'rgba(20,184,166,0.06)' },
  'Data & Platform':     { color: '#22c55e',          bg: 'rgba(34,197,94,0.06)'  },
  Fixes:                 { color: '#f97316',          bg: 'rgba(249,115,22,0.06)' },
  'Breaking Changes':    { color: '#ef4444',          bg: 'rgba(239,68,68,0.06)'  },
  'Known Issues':        { color: '#6366f1',          bg: 'rgba(99,102,241,0.06)' },
};

export const DEFAULT_SECTION_CONFIG = {
  color: '#6b7280',
  bg: 'rgba(107,114,128,0.06)',
};

