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
