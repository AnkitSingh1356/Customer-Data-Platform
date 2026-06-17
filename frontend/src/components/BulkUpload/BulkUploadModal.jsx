import { useRef, useState } from "react";
import apiFetch from "../../services/apiFetch";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Generic two-phase bulk upload modal: file selection → upload result summary.
// All endpoint URLs, accepted types, and required fields come from `config`
// so the same component is reusable across different entity types.
const BulkUploadModal = ({
  onClose,
  config,
  onSuccess,
}) => {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const {
    title,
    subtitle,
    uploadEndpoint,
    templateEndpoint,
    acceptedFileTypes = ".csv",
    requiredFields = [],
  } = config;

  // Validates file extension before staging; rejects non-CSV files early.
  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV files are allowed.");
      return;
    }

    setError("");
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await apiFetch(
        `${API_BASE}${uploadEndpoint}`,
        { method: "POST", body: formData }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Transition to the result summary phase; notify the parent of completion.
      setResult(data);

      if (onSuccess) {
        onSuccess(data);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    window.open(`${API_BASE}${templateEndpoint}`, "_blank");
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">

        <div className="modal-header">
          <div>
            <h2 className="modal-title">{title}</h2>
            <p className="modal-subtitle">{subtitle}</p>
          </div>

          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {!result && (
          <>
            <div className="modal-template-row">
              <span className="modal-template-text">
                Download CSV template before upload
              </span>

              <button
                className="btn-template"
                onClick={downloadTemplate}
              >
                Download Template
              </button>
            </div>

            <div
              className={`drop-zone ${dragOver ? "drag-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);

                const dropped = e.dataTransfer.files[0];
                handleFile(dropped);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {!file ? (
                <>
                  <div className="drop-zone-title">
                    Drag & Drop CSV File
                  </div>

                  <div className="drop-zone-sub">
                    or click to browse
                  </div>

                  <button className="btn-choose-file">
                    Choose File
                  </button>
                </>
              ) : (
                <div className="drop-zone-file-info">
                  <div className="drop-zone-filename">
                    {file.name}
                  </div>

                  <div className="drop-zone-filesize">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>

                  <button
                    className="btn-remove-file"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept={acceptedFileTypes}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            <div className="modal-info">
              <p>Required fields:</p>

              <div className="modal-info-fields">
                {requiredFields.join(", ")}
              </div>
            </div>

            {error && (
              <div className="modal-error">
                {error}
              </div>
            )}

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </button>

              <button
                className="btn-upload"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </>
        )}

        {result && (
          <div className="upload-result completed">
            <div className="upload-result-title">
              Upload Completed
            </div>

            <div className="upload-result-stats">
              <span className="stat-chip total">
                Total: {result.total || 0}
              </span>

              <span className="stat-chip success">
                Success: {result.inserted || 0}
              </span>

              <span className="stat-chip failed">
                Failed: {result.failed || 0}
              </span>
            </div>

            <button
              className="btn-upload-another"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BulkUploadModal;
