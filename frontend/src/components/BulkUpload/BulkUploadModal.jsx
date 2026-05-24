// //cdp-bulk-upload\sidebar-app\src\components\BulkUpload\BulkUploadModal.jsx
// import { useRef, useState, useEffect, useCallback } from "react";
// const API = `${import.meta.env.VITE_API_BASE_URL}/api/customers`;

// const BulkUploadModal = ({ onClose }) => {
//   const fileInputRef = useRef(null);

//   const pollIntervalRef = useRef(null);

//   const [dragOver, setDragOver] = useState(false);

//   const [file, setFile] = useState(null);

//   const [uploading, setUploading] = useState(false);

//   const [jobResult, setJobResult] = useState(null);

//   const [error, setError] = useState("");

//   const handleFile = useCallback((selectedFile) => {
//     if (!selectedFile) return;

//     const isCsv =
//       selectedFile.type === "text/csv" ||
//       selectedFile.name.toLowerCase().endsWith(".csv");

//     if (!isCsv) {
//       setError("Only .csv files are accepted.");

//       setFile(null);

//       return;
//     }

//     setError("");

//     setJobResult(null);

//     setFile(selectedFile);
//   }, []);

//   const onDrop = useCallback(
//     (e) => {
//       e.preventDefault();

//       setDragOver(false);

//       const droppedFile = e.dataTransfer.files?.[0];

//       handleFile(droppedFile);
//     },
//     [handleFile],
//   );

//   const resetModal = useCallback(() => {
//     setFile(null);

//     setJobResult(null);

//     setError("");

//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   }, []);

//   const downloadTemplate = async () => {
//     try {
//       const res = await fetch(`${API}/template`);

//       if (!res.ok) {
//         throw new Error("Failed to download template");
//       }

//       const blob = await res.blob();

//       const url = URL.createObjectURL(blob);

//       const a = document.createElement("a");

//       a.href = url;

//       a.download = "customer_upload_template.csv";

//       document.body.appendChild(a);

//       a.click();

//       a.remove();

//       URL.revokeObjectURL(url);
//     } catch {
//       setError("Could not download template. Is the server running?");
//     }
//   };

//   const pollJob = useCallback((jobId) => {
//     return new Promise((resolve, reject) => {
//       pollIntervalRef.current = setInterval(async () => {
//         try {
//           const res = await fetch(`${API}/bulk-upload/${jobId}`);

//           if (!res.ok) {
//             throw new Error("Failed to fetch upload status");
//           }

//           const data = await res.json();

//           if (data.status === "completed" || data.status === "failed") {
//             clearInterval(pollIntervalRef.current);

//             resolve(data);
//           }
//         } catch (err) {
//           clearInterval(pollIntervalRef.current);

//           reject(err);
//         }
//       }, 1200);
//     });
//   }, []);

//   useEffect(() => {
//     return () => {
//       if (pollIntervalRef.current) {
//         clearInterval(pollIntervalRef.current);
//       }
//     };
//   }, []);

//   const handleUpload = async () => {
//     if (!file || uploading) return;

//     setUploading(true);

//     setError("");

//     setJobResult(null);

//     const formData = new FormData();

//     formData.append("file", file);

//     try {
//       const res = await fetch(`${API}/bulk-upload`, {
//         method: "POST",
//         body: formData,
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || "Upload failed");
//       }

//       const result = await pollJob(data.jobId);

//       setJobResult(result);
//     } catch (err) {
//       setError(err.message || "Upload failed");
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="modal-backdrop" onClick={onClose}>
//       <div className="modal-box" onClick={(e) => e.stopPropagation()}>
//         <div className="modal-header">
//           <div>
//             <h2 className="modal-title">Bulk Upload — Customers</h2>

//             <p className="modal-subtitle">
//               Upload a CSV file to create multiple customer records at once.
//             </p>
//           </div>

//           <button
//             className="modal-close-btn"
//             onClick={onClose}
//             aria-label="Close"
//           >
//             ✕
//           </button>
//         </div>

//         <div className="modal-template-row">
//           <span className="modal-template-text">
//             Need a starting point? Download the template with all current
//             fields.
//           </span>

//           <button className="btn-template" onClick={downloadTemplate}>
//             Template
//           </button>
//         </div>

//         {!jobResult && (
//           <div
//             className={`drop-zone${
//               dragOver ? " drag-over" : ""
//             }${file ? " has-file" : ""}`}
//             onDragOver={(e) => {
//               e.preventDefault();

//               setDragOver(true);
//             }}
//             onDragLeave={() => setDragOver(false)}
//             onDrop={onDrop}
//             onClick={() => !file && fileInputRef.current?.click()}
//           >
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept=".csv,text/csv"
//               style={{ display: "none" }}
//               onChange={(e) => handleFile(e.target.files?.[0])}
//             />

//             {file ? (
//               <div className="drop-zone-file-info">
//                 <p className="drop-zone-filename">{file.name}</p>

//                 <p className="drop-zone-filesize">
//                   {(file.size / 1024).toFixed(1)} KB
//                 </p>

//                 <button
//                   className="btn-remove-file"
//                   onClick={(e) => {
//                     e.stopPropagation();

//                     resetModal();
//                   }}
//                 >
//                   Remove
//                 </button>
//               </div>
//             ) : (
//               <>
//                 <p className="drop-zone-title">Drop CSV file here</p>

//                 <p className="drop-zone-sub">or browse to upload</p>

//                 <button
//                   className="btn-choose-file"
//                   onClick={(e) => {
//                     e.stopPropagation();

//                     fileInputRef.current?.click();
//                   }}
//                 >
//                   Choose File
//                 </button>
//               </>
//             )}
//           </div>
//         )}

//         {jobResult && (
//           <div className={`upload-result ${jobResult.status}`}>
//             <div className="upload-result-header">
//               <span className="upload-result-title">
//                 {jobResult.status === "completed"
//                   ? "Upload Complete"
//                   : "Upload Failed"}
//               </span>
//             </div>

//             <div className="upload-result-stats">
//               <div className="stat-chip success">
//                 ✓ {jobResult.success_count} inserted
//               </div>

//               <div className="stat-chip total">
//                 Total: {jobResult.total_rows}
//               </div>

//               {jobResult.failed_count > 0 && (
//                 <div className="stat-chip failed">
//                   ✗ {jobResult.failed_count} failed
//                 </div>
//               )}
//             </div>

//             {jobResult.error_log?.length > 0 && (
//               <div className="error-log">
//                 <p className="error-log-title">
//                   Errors ({jobResult.error_log.length})
//                 </p>

//                 <ul className="error-log-list">
//                   {jobResult.error_log.slice(0, 8).map((e, i) => (
//                     <li key={i}>{e}</li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             <button className="btn-upload-another" onClick={resetModal}>
//               Upload Another File
//             </button>
//           </div>
//         )}

//         {error && <p className="modal-error">{error}</p>}

//         {!jobResult && (
//           <div className="modal-info">
//             <p>
//               <strong>Required fields for customer:</strong>
//             </p>

//             <p className="modal-info-fields">first_name, email</p>

//             <p>
//               <strong>Duplicate detection key:</strong>
//             </p>

//             <p className="modal-info-fields">email</p>
//           </div>
//         )}

//         {!jobResult && (
//           <div className="modal-footer">
//             <button
//               className="btn-cancel"
//               onClick={onClose}
//               disabled={uploading}
//             >
//               Cancel
//             </button>

//             <button
//               className="btn-upload"
//               onClick={handleUpload}
//               disabled={!file || uploading}
//             >
//               {uploading ? "Processing..." : "Upload"}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default BulkUploadModal;

import { useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

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

      const res = await fetch(
        `${API_BASE}${uploadEndpoint}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

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
