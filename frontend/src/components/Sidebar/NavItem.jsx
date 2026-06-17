import NavIcon from "./NavIcon";

// Single sidebar entry. `isActive` is resolved by the parent (Sidebar) so
// this component stays purely presentational with no routing knowledge.
const NavItem = ({ item, isActive, onClick }) => (
  <li
    className={`sidebar-nav-item${isActive ? " active" : ""}`}
    onClick={() => onClick(item.id)}
  >
    <span className="sidebar-nav-icon">
      <NavIcon name={item.icon} />
    </span>
    <span className="sidebar-nav-label">{item.label}</span>
  </li>
);

export default NavItem;
