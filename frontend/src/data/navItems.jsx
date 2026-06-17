// Master list of every possible nav item; used for reference and future dynamic menus
export const allNavItems = [
  { id: "dashboard",            label: "Dashboard",                 icon: "dashboard" },
  { id: "customer360",          label: "Customer 360",              icon: "customer360" },
  { id: "dealer-network",       label: "Dealer Network",            icon: "dealerNetwork" },
  { id: "identity-resolution",  label: "Identity Resolution",       icon: "identityResolution" },
  { id: "segments",             label: "Segments",                  icon: "segments" },
  { id: "behavioral-analytics", label: "Behavioral Analytics",      icon: "behavioralAnalytics" },
  { id: "promotional",          label: "Promotional Effectiveness", icon: "promotional" },
  { id: "consent-compliance",   label: "Consent & Compliance",      icon: "consentCompliance" },
  { id: "access-management",    label: "Access Management",         icon: "accessManagement" },
  { id: "data-model",           label: "Data Model & Uploads",      icon: "dataModel" },
  { id: "release-notes",        label: "Release Notes",             icon: "releaseNotes" },
  { id: "settings",             label: "Settings",                  icon: "settings" },
];

// Persona-scoped nav item lists — only items present here are visible in the sidebar.
// The id values must match the keys used in renderPage() (App.jsx) and canAccess().
export const navItemsByPersona = {
  // Admin sees everything, including access-management
  admin: [
    { id: "dashboard",            label: "Dashboard",               icon: "dashboard" },
    { id: "customer360",          label: "Customer 360",            icon: "customer360" },
    { id: "dealer-network",       label: "Dealer Network",          icon: "dealerNetwork" },
    { id: "identity-resolution",  label: "Identity Resolution",     icon: "identityResolution" },
    { id: "segments",             label: "Segments",                icon: "segments" },
    { id: "behavioral-analytics", label: "Behavioral Analytics",    icon: "behavioralAnalytics" },
    { id: "promotional",          label: "Promotional Effectiveness", icon: "promotional" },
    { id: "consent-compliance",   label: "Consent & Compliance",    icon: "consentCompliance" },
    { id: "access-management",    label: "Access Management",       icon: "accessManagement" },
    { id: "data-model",           label: "Data Model & Uploads",    icon: "dataModel" },
    { id: "release-notes",        label: "Release Notes",           icon: "releaseNotes" },
    { id: "settings",             label: "Settings",                icon: "settings" },
  ],
  // Marketing sees customer and campaign-related pages only; no compliance or admin tools
  marketing: [
    { id: "dashboard",    label: "Dashboard",     icon: "dashboard" },
    { id: "customer360",  label: "Customer 360",  icon: "customer360" },
    { id: "segments",     label: "Segments",      icon: "segments" },
    { id: "analytics",    label: "Analytics",     icon: "behavioralAnalytics" },
    { id: "promotions",   label: "Promotions",    icon: "promotional" },
    { id: "release-notes",label: "Release Notes", icon: "releaseNotes" },
  ],
  // Compliance sees consent, audit, and policy pages; no customer data or campaign tools
  compliance: [
    { id: "dashboard",    label: "Dashboard",     icon: "dashboard" },
    { id: "consent",      label: "Consent",       icon: "consentCompliance" },
    { id: "reports",      label: "Reports",       icon: "dataModel" },
    { id: "policy",       label: "Policy",        icon: "identityResolution" },
    { id: "audit",        label: "Audit",         icon: "behavioralAnalytics" },
    { id: "release-notes",label: "Release Notes", icon: "releaseNotes" },
    { id: "settings",     label: "Settings",      icon: "settings" },
  ],
};
