import { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { RBACProvider, useRBAC } from "./auth/RBACContext";
import Sidebar from "./components/Sidebar/Sidebar";
import Customer360Page from "./pages/Customer360/Customer360Page";
import SegmentsPage from "./pages/Segments/SegmentsPage";
import LoginPage from "./pages/Auth/LoginPage";
import SignupPage from "./pages/Auth/SignupPage";
import UserProfileModal from "./components/UserProfile/UserProfileModal";
import { canAccess } from "./config/personaConfig";
import { CUSTOMER_TYPE_PORTALS } from "./config/constants";
import DealerNetworkPage from "./pages/DealerNetwork/DealerNetworkPage";
import BehavioralAnalyticsPage from "./pages/BehavioralAnalytics/BehavioralAnalyticsPage";
import ConsentCompliancePage from "./pages/Compliance/ConsentCompliancePage";
import PromotionalEffectivenessPage from "./pages/PromotionalEffectiveness/PromotionalEffectivenessPage";
import IdentityResolution from "./pages/IdentityResolution/IdentityResolutionPage";
import AccessManagementPage from "./pages/AccessManagement/index";
import ReleaseNotesPage from "./pages/ReleaseNotes/ReleaseNotesPage";
import "./styles/access-management.css";


function WelcomeOverlay({ customerType, userName, onDismiss }) {
  const portal = CUSTOMER_TYPE_PORTALS[customerType] || CUSTOMER_TYPE_PORTALS["Employee"];

  // Auto-dismiss after 3 s; user can also skip via the button
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="welcome-overlay">
      <div className="welcome-card">
        <div className="welcome-brand">Customer Data Platform</div>
        <div className="welcome-greeting">Welcome back, {userName?.split(" ")[0] || "there"}!</div>
        <div className="welcome-portal" style={{ color: portal.color }}>
          {portal.name}
        </div>
        <div className="welcome-sub">You are signed in. Loading your workspace…</div>
        <button className="welcome-dismiss" onClick={onDismiss}>Continue →</button>
      </div>
    </div>
  );
}

function AppShell() {
  const { user, persona, logout } = useAuth();
  const { canAccessPage }         = useRBAC();

  const [activeNav,       setActiveNav]       = useState("customer360");
  const [selectedPersona, setSelectedPersona] = useState(persona ?? "admin");
  const [showProfile,     setShowProfile]     = useState(false);
  // Per-user key ensures the overlay shows once per browser session, not per page load
  const welcomeKey = `cdp_welcomed_${user?.id}`;
  const [showWelcome, setShowWelcome] = useState(() => {
    if (sessionStorage.getItem(welcomeKey)) return false;
    sessionStorage.setItem(welcomeKey, "1");
    return true;
  });
  const welcomeKeyRef = useRef(welcomeKey);
  // Clean up the session flag on unmount so it re-shows on next full login
  useEffect(() => {
    return () => sessionStorage.removeItem(welcomeKeyRef.current);
  }, []);

  const isAdmin          = user?.role === "admin";
  // Admins can switch personas via the dropdown; non-admins are locked to their assigned persona
  const effectivePersona = isAdmin ? selectedPersona : (persona ?? "marketing");

  const ACCESS_DENIED = (
    <div className="app-placeholder-page">
      <p className="app-placeholder">Access denied — you don't have permission to view this page.</p>
    </div>
  );


  // Admins bypass RBAC; all other roles must have explicit page access
  const gate = (pageKey, component) => {
    if (isAdmin) return component;
    return canAccessPage(pageKey) ? component : ACCESS_DENIED;
  };

  const renderPage = () => {
    if (activeNav === "customer360")          return gate("customer360",          <Customer360Page />);
    if (activeNav === "dealer-network")       return gate("dealer-network",       <DealerNetworkPage />);
    if (activeNav === "behavioral-analytics") return gate("behavioral-analytics", <BehavioralAnalyticsPage />);
    if (activeNav === "promotional")          return gate("promotional",          <PromotionalEffectivenessPage />);
    if (activeNav === "consent-compliance")   return gate("consent-compliance",   <ConsentCompliancePage />);
    if (activeNav === "identity-resolution")  return gate("identity-resolution",  <IdentityResolution />);
    if (activeNav === "segments")             return gate("segments",             <SegmentsPage persona={effectivePersona} />);

    // Access Management is admin-only regardless of RBAC page grants
    if (activeNav === "access-management") {
      if (!isAdmin) return ACCESS_DENIED;
      return <AccessManagementPage />;
    }
    if (activeNav === "release-notes")  return gate("release-notes", <ReleaseNotesPage />);
    return (
      <div className="app-placeholder-page">
        <p className="app-placeholder">{activeNav} — coming soon</p>
      </div>
    );
  };

  const initials =
    user?.avatar_initials ||
    (user?.full_name
      ? user.full_name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "AS");

  return (
    <>
      {showWelcome && (
        <WelcomeOverlay
          customerType={user?.customer_type}
          userName={user?.full_name}
          onDismiss={() => setShowWelcome(false)}
        />
      )}

      <div className="app-layout">
        <Sidebar
          persona={effectivePersona}
          activeId={activeNav}
          onNavClick={setActiveNav}
        />
        <div className="app-content">
          <header className="app-topbar">
            <button className="topbar-menu-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <div className="topbar-center">
              {isAdmin ? (
                <>
                  <select
                    className="persona-dropdown"
                    value={effectivePersona}
                    onChange={(e) => {
                      setSelectedPersona(e.target.value);
                      setActiveNav("dashboard");
                    }}
                  >
                    <option value="admin">CDP ADMIN PERSONA</option>
                    <option value="marketing">CDP MARKETING PERSONA</option>
                    <option value="compliance">CDP COMPLIANCE PERSONA</option>
                  </select>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#555"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </>
              ) : (
                <span className="persona-dropdown persona-dropdown--readonly">
                  {user?.customer_type
                    ? `CDP ${user.customer_type.toUpperCase()} PORTAL`
                    : "CDP CUSTOMER PORTAL"}
                </span>
              )}
            </div>
            <div className="topbar-right">
              <button className="topbar-icon-btn" title="Help">
                ?
              </button>
              <button className="topbar-icon-btn" title="Notifications">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="notif-dot" />
              </button>
              <button
                className="topbar-avatar topbar-avatar-btn"
                onClick={() => setShowProfile(true)}
                title="View profile"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user?.full_name || "User"}
                    className="topbar-avatar-image"
                  />
                ) : (
                  initials
                )}
              </button>
              <div className="topbar-user">
                <span className="topbar-name">{user?.full_name || "User"}</span>
                <span
                  className="topbar-role"
                  style={{ textTransform: "capitalize" }}
                >
                  {user?.customer_type ? `${user.role} · ${user.customer_type}` : user?.role || "Admin"}
                </span>
              </div>
              <button
                className="topbar-icon-btn"
                onClick={logout}
                title="Log out"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </div>
          </header>
          <main className="app-main">{renderPage()}</main>
        </div>

        {showProfile && (
          <UserProfileModal onClose={() => setShowProfile(false)} />
        )}
      </div>
    </>
  );
}

// Top-level auth guard: renders the app shell when authenticated,
// otherwise shows login or signup based on local view state
function AuthGate() {
  const { isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState("login");

  if (isAuthenticated) return <AppShell />;

  return authView === "login" ? (
    <LoginPage onSwitchToSignup={() => setAuthView("signup")} />
  ) : (
    <SignupPage onSwitchToLogin={() => setAuthView("login")} />
  );
}

// Provider nesting order matters: ErrorBoundary → AuthProvider → RBACProvider
// RBACProvider reads from AuthContext, so AuthProvider must wrap it
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RBACProvider>
          <AuthGate />
        </RBACProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
