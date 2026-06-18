import { useState } from "react";
import NavItem from "./NavItem";
import { navItemsByPersona, allNavItems } from "../../data/navItems";
import { useRBAC } from "../../auth/RBACContext";

/**
 * Renders the application sidebar with persona-aware or RBAC-filtered navigation items.
 * Usage: Render once at the app layout level; pass the active nav ID and a click handler to control routing.
 * Admins receive a persona-specific curated list; non-admin users see items filtered by RBAC menu access.
 * @param {Object} props
 * @param {string} [props.persona="admin"] - Current user persona key used to select the nav item list
 * @param {string} [props.activeId] - Controlled active nav item ID; falls back to internal state if omitted
 * @param {function} [props.onNavClick] - Optional callback invoked with the clicked item ID
 * @returns {JSX.Element}
 */
const Sidebar = ({ persona = "admin", activeId, isOpen = false, onNavClick }) => {
  const { canAccessMenu } = useRBAC();
  // Supports both controlled (activeId prop) and uncontrolled active-item modes.
  const [internalActive, setInternalActive] = useState("dashboard");
  const currentActive = activeId ?? internalActive;
  const handleClick = (id) => {
    setInternalActive(id);
    onNavClick?.(id);
  };

  // Admins receive a curated persona-specific list; all other roles go through
  // RBAC permission filtering so only accessible items are rendered.
  const isAdmin = persona === "admin";
  const items = isAdmin
    ? (navItemsByPersona[persona] ?? navItemsByPersona.admin)
    : allNavItems.filter((item) => canAccessMenu(item.id));

  return (
    <aside className={`sidebar${isOpen ? " sidebar--open" : ""}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-dunlop">
          <svg width="60" height="16" viewBox="0 0 120 30" fill="white">
            <text x="0" y="22" fontFamily="Arial Black, sans-serif" fontSize="22" fontWeight="900" fill="white">DUNLOP</text>
          </svg>
        </div>
        <div className="sidebar-logo-brands">
          <span className="logo-srixon">SRIXON</span>
          <span className="logo-cleveland">Cleveland</span>
          <span className="logo-xxio">XXIO</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <ul className="sidebar-nav-list">
          {items.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentActive === item.id}
              onClick={handleClick}
            />
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <span>Manage cookies or opt out</span>
      </div>
    </aside>
  );
};

export default Sidebar;
