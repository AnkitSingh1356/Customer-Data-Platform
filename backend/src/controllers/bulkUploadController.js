//cdp-bulk-upload\cdp-backend\src\controllers\bulkUploadController.js
const { createJob, processUpload, getJob } = require("../services/bulkUploadService");
const { buildTemplateCsv }                 = require("../utils/csvParser");

async function startBulkUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Field name must be 'file'." });
  }

  try {
    const jobId = await createJob(req.file.originalname);

    processUpload(jobId, req.file.path, req.file.originalname).catch((err) =>
      console.error("[BulkUpload] background error:", err.message)
    );

    return res.status(202).json({
      jobId,
      message: "Upload accepted. Poll /bulk-upload/:jobId for status.",
    });
  } catch (err) {
    console.error("[BulkUpload] startBulkUpload error:", err.message);
    return res.status(500).json({ error: "Failed to start upload job." });
  }
}

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
      error_log:     job.error_log || [],
      created_at:    job.created_at,
      completed_at:  job.completed_at,
    });
  } catch (err) {
    console.error("[BulkUpload] getUploadStatus error:", err.message);
    return res.status(500).json({ error: "Failed to fetch job status." });
  }
}


function downloadTemplate(req, res) {
  const csv = buildTemplateCsv();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="customer_upload_template.csv"');
  res.send(csv);
}

module.exports = { startBulkUpload, getUploadStatus, downloadTemplate };
