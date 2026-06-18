/**
 * Renders a button that triggers an export action via a caller-supplied callback.
 * Usage: Use in any page toolbar where CSV or data export is needed; pass onExport to handle the logic.
 * @param {Object} props
 * @param {function} props.onExport - Callback invoked when the button is clicked
 * @param {string} [props.label="Export"] - Button label text
 * @param {string} [props.className=""] - Additional CSS class for styling
 * @param {boolean} [props.disabled=false] - When true, disables the button (e.g. during loading)
 * @returns {JSX.Element}
 */
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
