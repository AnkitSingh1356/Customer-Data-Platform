//cdp-bulk-upload\sidebar-app\src\App.jsx
import { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Sidebar from "./components/Sidebar/Sidebar";
import Customer360Page from "./pages/Customer360/Customer360Page";
import SegmentsPage from "./pages/Segments/SegmentsPage";
import LoginPage from "./pages/Auth/LoginPage";
import SignupPage from "./pages/Auth/SignupPage";
import UserProfileModal from "./components/UserProfile/UserProfileModal";
import { canAccess } from "./config/personaConfig";
import DealerNetworkPage from "./pages/DealerNetwork/DealerNetworkPage";
import BehavioralAnalyticsPage from "./pages/BehavioralAnalytics/BehavioralAnalyticsPage";
import ConsentCompliancePage from "./pages/Compliance/ConsentCompliancePage";
function AppShell() {
  const { user, persona, logout } = useAuth();

  const [activeNav, setActiveNav] = useState("customer360");
  const [selectedPersona, setSelectedPersona] = useState(persona ?? "admin");
  const [showProfile, setShowProfile] = useState(false);

  const effectivePersona = selectedPersona;

  const renderPage = () => {
    if (activeNav === "customer360") return <Customer360Page />;
    if (activeNav === "dealer-network") return <DealerNetworkPage />;
    if (activeNav === "behavioral-analytics") return <BehavioralAnalyticsPage />;
    if (activeNav === "consent-compliance") {
      return <ConsentCompliancePage />;
    }
    if (activeNav === "segments") {
      if (!canAccess(effectivePersona, "segments")) {
        return (
          <div className="app-placeholder-page">
            <p className="app-placeholder">
              Access denied — Segments not available for this persona.
            </p>
          </div>
        );
      }
      return <SegmentsPage persona={effectivePersona} />;
    }
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
                {user?.role || "Admin"}
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
  );
}

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

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
