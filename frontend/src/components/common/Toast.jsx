/**
 * Lightweight success toast notification controlled externally via a visibility prop.
 * Usage: Render at the page or layout level; toggle visible to show/hide the notification.
 * @param {Object} props
 * @param {string} props.message - The notification text to display
 * @param {boolean} props.visible - When false the component renders nothing
 * @returns {JSX.Element|null}
 */
const Toast = ({
    message,
    visible,
  }) => {
    if (!visible) return null;
  
    return (
      <div className="cc-toast">
        <span>✔</span>
  
        <span>{message}</span>
      </div>
    );
  };
  
  export default Toast;
