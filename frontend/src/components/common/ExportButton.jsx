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
