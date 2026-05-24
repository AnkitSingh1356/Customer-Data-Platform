//cdp-bulk-upload\cdp-backend\src\services\bulkUploadService.js
const pool = require("../config/db");
const { parseCSV }    = require("../utils/csvParser");
const { generateCdpId } = require("../utils/cdpId");
const fs              = require("fs");

async function createJob(filename) {
  const res = await pool.query(
    `INSERT INTO bulk_upload_jobs (filename, status)
     VALUES ($1, 'pending') RETURNING id`,
    [filename]
  );
  return res.rows[0].id;
}

async function markProcessing(jobId) {
  await pool.query(
    `UPDATE bulk_upload_jobs SET status = 'processing' WHERE id = $1`,
    [jobId]
  );
}

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

async function processUpload(jobId, filePath, filename) {
  await markProcessing(jobId);

  let totalRows    = 0;
  let successCount = 0;
  let failedCount  = 0;
  const errorLog   = [];

  try {
    const { rows, errors } = await parseCSV(filePath);

    failedCount += errors.length;
    errorLog.push(...errors.slice(0, 200)); 
    totalRows = rows.length + errors.length;

    const CHUNK = 100;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      await upsertChunk(jobId, chunk, errorLog);
    }

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
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
}


async function upsertChunk(jobId, rows, errorLog) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const row of rows) {
      try {
        const cdpId = generateCdpId();
        const name  = [row.first_name, row.last_name].filter(Boolean).join(" ");

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

        await client.query(
          `INSERT INTO upload_errors (job_id, row_number, row_data, error_msg)
           VALUES ($1, $2, $3, 'OK') ON CONFLICT DO NOTHING`,
          [jobId, row._rowNum, JSON.stringify(row)]
        ).catch(() => {}); 

      } catch (rowErr) {
        const msg = `Row ${row._rowNum}: DB error — ${rowErr.message}`;
        errorLog.push(msg);
        await client.query(
          `INSERT INTO upload_errors (job_id, row_number, row_data, error_msg)
           VALUES ($1, $2, $3, $4)`,
          [jobId, row._rowNum, JSON.stringify(row), rowErr.message]
        ).catch(() => {});
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

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
