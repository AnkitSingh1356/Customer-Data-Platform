const pool = require("../config/db");
const { parseCSV }    = require("../utils/csvParser");
const { generateCdpId } = require("../utils/cdpId");
const fs              = require("fs");
const { UPLOAD_CHUNK_SIZE, MAX_UPLOAD_ERRORS } = require("../config/constants");

/**
 * Creates a new upload job record in 'pending' state and returns its ID.
 * Usage: Called by bulkUploadController before processing begins
 * @param {string} filename - Original filename for display in the UI
 * @returns {Promise<number>} The new job's primary key
 */
async function createJob(filename) {
  const res = await pool.query(
    `INSERT INTO bulk_upload_jobs (filename, status)
     VALUES ($1, 'pending') RETURNING id`,
    [filename]
  );
  return res.rows[0].id;
}

/**
 * Transitions a job's status to 'processing' so the UI can display progress.
 * Usage: Called internally by processUpload at the start of the upload pipeline
 * @param {number} jobId - The job's primary key
 * @returns {Promise<void>}
 */
async function markProcessing(jobId) {
  await pool.query(
    `UPDATE bulk_upload_jobs SET status = 'processing' WHERE id = $1`,
    [jobId]
  );
}

/**
 * Writes final counters and the error log to the job record; called on both success and failure.
 * Usage: Called internally by processUpload after all chunks are upserted (or on error)
 * @param {number} jobId - The job's primary key
 * @param {Object} result - Final job statistics
 * @param {number} result.totalRows - Total rows parsed from the CSV
 * @param {number} result.successCount - Number of rows upserted successfully
 * @param {number} result.failedCount - Number of rows that failed
 * @param {Array<string>} result.errorLog - Per-row error messages
 * @param {string} result.status - Final status: "completed" or "failed"
 * @returns {Promise<void>}
 */
async function finaliseJob(jobId, { totalRows, successCount, failedCount, errorLog, status }) {
  await pool.query(
    `UPDATE bulk_upload_jobs
     SET status        = $1,
         total_rows    = $2,
         success_count = $3,
         failed_count  = $4,
         error_log     = $5,
         completed_at  = NOW()
     WHERE id = $6`,
    [status, totalRows, successCount, failedCount, JSON.stringify(errorLog), jobId]
  );
}

/**
 * Orchestrates the full upload pipeline: parse CSV, upsert chunks, then finalise the job.
 * Removes the temp file on completion regardless of success or failure.
 * Usage: Called by bulkUploadController after creating the job record
 * @param {number} jobId - The job's primary key (used to update status and log errors)
 * @param {string} filePath - Absolute path to the uploaded temp file
 * @param {string} filename - Original filename (kept for reference only)
 * @returns {Promise<void>}
 */
async function processUpload(jobId, filePath, filename) {
  await markProcessing(jobId);

  let totalRows    = 0;
  let successCount = 0;
  let failedCount  = 0;
  const errorLog   = [];

  try {
    const { rows, errors } = await parseCSV(filePath);

    // Cap parse-level errors stored in memory to avoid unbounded log growth
    failedCount += errors.length;
    errorLog.push(...errors.slice(0, MAX_UPLOAD_ERRORS));
    totalRows = rows.length + errors.length;

    // Process in batches to keep individual transactions small
    for (let i = 0; i < rows.length; i += UPLOAD_CHUNK_SIZE) {
      const chunk = rows.slice(i, i + UPLOAD_CHUNK_SIZE);
      await upsertChunk(jobId, chunk, errorLog);
    }

    // Derive success count from total valid rows minus any upsert failures
    const upsertFails = errorLog.length - errors.length;
    successCount = rows.length - upsertFails;
    failedCount  = totalRows - successCount;

    await finaliseJob(jobId, {
      totalRows,
      successCount,
      failedCount,
      errorLog,
      status: "completed",
    });
  } catch (err) {
    console.error("[BulkUpload] processUpload error:", err.message);
    errorLog.push(`Processing error: ${err.message}`);
    await finaliseJob(jobId, {
      totalRows,
      successCount,
      failedCount: totalRows - successCount + 1,
      errorLog,
      status: "failed",
    });
  } finally {
    // Always remove the temp file regardless of success or failure
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
}


/**
 * Maps Postgres constraint error codes to human-readable messages for the error log.
 * Usage: Called by upsertChunk when a row-level DB insert fails
 * @param {Error} e - The Postgres error object (expects e.code)
 * @returns {string} A user-facing error description
 */
function friendlyDbError(e) {
  if (e.code === "23505") return "Duplicate record — row already exists.";
  if (e.code === "23502") return "Missing required field.";
  if (e.code === "23503") return "Referenced record does not exist.";
  return "Database error — row could not be inserted.";
}

/**
 * Upserts a batch of customer rows using per-row SAVEPOINTs so one failure
 * skips only that row without aborting the rest of the chunk.
 * Usage: Called internally by processUpload for each UPLOAD_CHUNK_SIZE slice of rows
 * @param {number} jobId - Job ID used to persist per-row error details
 * @param {Array<Object>} rows - Validated customer row objects from parseCSV
 * @param {Array<string>} errorLog - Mutable error log array; failed rows are appended here
 * @returns {Promise<void>}
 */
async function upsertChunk(jobId, rows, errorLog) {
  const client = await pool.connect();
  try {

    for (const row of rows) {
      try {
        await client.query("SAVEPOINT row_save");
        const cdpId = generateCdpId();

        // On email conflict, update mutable fields but preserve existing non-null values
        await client.query(
          `INSERT INTO customers
             (cdp_id, first_name, last_name, email, phone,
              customer_type, primary_source, status, dealer_code)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (email) DO UPDATE SET
             first_name     = EXCLUDED.first_name,
             last_name      = EXCLUDED.last_name,
             phone          = COALESCE(EXCLUDED.phone, customers.phone),
             customer_type  = COALESCE(EXCLUDED.customer_type, customers.customer_type),
             primary_source = COALESCE(EXCLUDED.primary_source, customers.primary_source),
             status         = COALESCE(EXCLUDED.status, customers.status),
             dealer_code    = COALESCE(EXCLUDED.dealer_code, customers.dealer_code),
             updated_at     = NOW()`,
          [
            cdpId,
            row.first_name,
            row.last_name        || null,
            row.email,
            row.phone            || null,
            row.customer_type    || "B2C Customer",
            row.primary_source   || null,
            row.status           || "Active",
            row.dealer_code      || null,
          ]
        );

        await client.query("RELEASE SAVEPOINT row_save");

      } catch (rowErr) {
        // Roll back only this row's savepoint, then log and continue
        await client.query("ROLLBACK TO SAVEPOINT row_save");
        console.error(`[upsertChunk] row ${row._rowNum}:`, rowErr.message);
        const safeMsg = `Row ${row._rowNum}: ${friendlyDbError(rowErr)}`;
        errorLog.push(safeMsg);

        // Persist per-row error details for the job report; ignore if this insert fails
        await pool.query(
          `INSERT INTO upload_errors (job_id, row_number, row_data, error_msg)
           VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [jobId, row._rowNum, JSON.stringify(row), friendlyDbError(rowErr)]
        ).catch(() => {});
      }
    }
  } finally {
    client.release();
  }
}

/**
 * Retrieves job status and counters for polling or result display.
 * Usage: Called by bulkUploadController.getJob to return upload progress to the client
 * @param {number} jobId - The job's primary key
 * @returns {Promise<Object|null>} Job record with status, counters, and error_log, or null if not found
 */
async function getJob(jobId) {
  const res = await pool.query(
    `SELECT id, filename, status, total_rows, success_count,
            failed_count, error_log, created_at, completed_at
     FROM bulk_upload_jobs WHERE id = $1`,
    [jobId]
  );
  return res.rows[0] || null;
}

module.exports = { createJob, processUpload, getJob };
