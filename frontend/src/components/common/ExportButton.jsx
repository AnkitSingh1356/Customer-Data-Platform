// Thin wrapper that delegates export logic entirely to the onExport callback,
// keeping this component free of data or format concerns.
const ExportButton = ({
    onExport,
    label = "Export",
    className = "",
    disabled = false,
  }) => {
    return (
      <button
        type="button"
        className={className}
        onClick={onExport}
        disabled={disabled}
      >
        {label}
      </button>
    );
  };
  
  export default ExportButton;
