// Lightweight success toast; visibility is controlled externally via the visible prop.
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
