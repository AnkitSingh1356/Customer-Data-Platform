//frontend\src\components\consent-compliance\ConsentStatusBadge.jsx
const ConsentStatusBadge = ({ status = "none", onClick }) => {
  return (
    <span
      className={`consent-status-badge ${status.toLowerCase()}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {status}
    </span>
  );
};

export default ConsentStatusBadge;
