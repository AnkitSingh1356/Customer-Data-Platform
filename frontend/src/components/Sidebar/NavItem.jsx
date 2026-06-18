import NavIcon from "./NavIcon";

/**
 * Renders a single sidebar navigation entry with an icon and label.
 * Usage: Used by Sidebar to render each item in the nav list; isActive is resolved by the parent.
 * @param {Object} props
 * @param {Object} props.item - Nav item data with id, label, and icon fields
 * @param {boolean} props.isActive - When true, applies the active CSS modifier
 * @param {function} props.onClick - Callback invoked with item.id when the entry is clicked
 * @returns {JSX.Element}
 */
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
