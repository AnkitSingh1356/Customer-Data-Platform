import { useState } from "react";
import NavItem from "./NavItem";
import { navItemsByPersona, allNavItems } from "../../data/navItems";
import { useRBAC } from "../../auth/RBACContext";

const Sidebar = ({ persona = "admin", activeId, onNavClick }) => {
  const { canAccessMenu } = useRBAC();
  const [internalActive, setInternalActive] = useState("dashboard");
  const currentActive = activeId ?? internalActive;
  const handleClick = (id) => {
    setInternalActive(id);
    onNavClick?.(id);
  };

  const isAdmin = persona === "admin";
  const items = isAdmin
    ? (navItemsByPersona[persona] ?? navItemsByPersona.admin)
    : allNavItems.filter((item) => canAccessMenu(item.id));

  return (
    <aside className="sidebar">
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
