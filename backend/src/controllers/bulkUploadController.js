const { createJob, processUpload, getJob } = require("../services/bulkUploadService");
const { buildTemplateCsv }                 = require("../utils/csvParser");

// POST /bulk-upload — accepts a multipart CSV file, registers a job record,
//   then processes rows asynchronously so the HTTP response returns immediately
async function startBulkUpload(req, res) {
  // Multer attaches the file to req.file; reject early if none was provided
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Field name must be 'file'." });
  }

  try {
    const jobId = await createJob(req.file.originalname);

    // Fire-and-forget: processing runs in the background; errors are logged
    // without failing the 202 response already sent to the client
    processUpload(jobId, req.file.path, req.file.originalname).catch((err) =>
      console.error("[BulkUpload] background error:", err.message)
    );

    // 202 Accepted signals the job was queued, not yet completed
    return res.status(202).json({
      jobId,
      message: "Upload accepted. Poll /bulk-upload/:jobId for status.",
    });
  } catch (err) {
    console.error("[BulkUpload] startBulkUpload error:", err.message);
    return res.status(500).json({ error: "Failed to start upload job." });
  }
}

// GET /bulk-upload/:jobId — polls processing progress; clients use this to
//   track row counts, failure details, and completion state
async function getUploadStatus(req, res) {
  const { jobId } = req.params;
  if (!jobId) return res.status(400).json({ error: "Missing jobId." });

  try {
    const job = await getJob(jobId);
    if (!job) return res.status(404).json({ error: "Job not found." });

    return res.json({
      jobId:         job.id,
      filename:      job.filename,
      status:        job.status,
      total_rows:    job.total_rows,
      success_count: job.success_count,
      failed_count:  job.failed_count,
      // error_log contains per-row failure details; default to empty array
      error_log:     job.error_log || [],
      created_at:    job.created_at,
      completed_at:  job.completed_at,
    });
  } catch (err) {
    console.error("[BulkUpload] getUploadStatus error:", err.message);
    return res.status(500).json({ error: "Failed to fetch job status." });
  }
}

// GET /bulk-upload/template — streams a pre-formatted CSV with the required
//   column headers so users know how to structure their upload file
function downloadTemplate(req, res) {
  const csv = buildTemplateCsv();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="customer_upload_template.csv"');
  res.send(csv);
}

module.exports = { startBulkUpload, getUploadStatus, downloadTemplate };
