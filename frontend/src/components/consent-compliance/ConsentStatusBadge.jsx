// Maps a consent status string to a CSS-class-driven colour badge.
// When onClick is provided the badge acts as an interactive toggle target.
const ConsentStatusBadge = ({ status = "none", onClick }) => {
  return (
    <span
      // CSS class drives colour: granted=green, revoked=red, pending=amber, none=grey
      className={`consent-status-badge ${status.toLowerCase()}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {status}
    </span>
  );
};

export default ConsentStatusBadge;
