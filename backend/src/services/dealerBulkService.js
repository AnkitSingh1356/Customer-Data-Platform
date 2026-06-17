const pool                              = require("../config/db");
const { parseDealerCSV }                = require("../utils/dealerCsvParser");
const fs                                = require("fs");

// Creates a pending job record for async tracking; returns the new job ID.
async function createDealerJob(filename) {
  const res = await pool.query(
    `INSERT INTO bulk_upload_jobs (filename, status) VALUES ($1, 'pending') RETURNING id`,
    [filename]
  );
  return res.rows[0].id;
}

// Processes a dealer CSV upload inside a single DB transaction. Row-level
// failures are captured in errorLog without aborting the whole batch.
// The temp file is always cleaned up regardless of outcome.
async function processDealerUpload(jobId, filePath) {
  // Mark processing
  await pool.query(`UPDATE bulk_upload_jobs SET status = 'processing' WHERE id = $1`, [jobId]);

  let totalRows = 0, successCount = 0, failedCount = 0;
  const errorLog = [];

  try {
    const { rows, errors } = await parseDealerCSV(filePath);
    failedCount = errors.length;
    errorLog.push(...errors.slice(0, 200));
    totalRows = rows.length + errors.length;

    // All upserts run in one transaction; row-level catch keeps the batch going
    // while recording individual failures in errorLog.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const row of rows) {
        try {
          await client.query(
            `INSERT INTO dealers
               (name, code, parent_code, type, tier, region, city, country,
                email, phone, status, data_owner, annual_revenue, contacts)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
             ON CONFLICT (code) DO UPDATE SET
               name           = EXCLUDED.name,
               parent_code    = COALESCE(EXCLUDED.parent_code,    dealers.parent_code),
               type           = COALESCE(EXCLUDED.type,           dealers.type),
               tier           = COALESCE(EXCLUDED.tier,           dealers.tier),
               region         = COALESCE(EXCLUDED.region,         dealers.region),
               city           = COALESCE(EXCLUDED.city,           dealers.city),
               country        = COALESCE(EXCLUDED.country,        dealers.country),
               email          = COALESCE(EXCLUDED.email,          dealers.email),
               phone          = COALESCE(EXCLUDED.phone,          dealers.phone),
               status         = COALESCE(EXCLUDED.status,         dealers.status),
               data_owner     = COALESCE(EXCLUDED.data_owner,     dealers.data_owner),
               annual_revenue = COALESCE(EXCLUDED.annual_revenue, dealers.annual_revenue),
               contacts       = COALESCE(EXCLUDED.contacts,       dealers.contacts),
               updated_at     = NOW()`,
            [
              row.name,
              row.code,
              row.parent_code    || null,
              row.type           || "Branch",
              (row.tier          || "standard").toLowerCase(),
              row.region         || null,
              row.city           || null,
              row.country        || null,
              row.email          || null,
              row.phone          || null,
              row.status         || "Active",
              row.data_owner     || null,
              parseFloat(row.annual_revenue) || 0,
              parseInt(row.contacts)         || 0,
            ]
          );
          successCount++;
        } catch (rowErr) {
          errorLog.push(`Row ${row._rowNum}: ${rowErr.message}`);
          failedCount++;
        }
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    await pool.query(
      `UPDATE bulk_upload_jobs SET status=$1,total_rows=$2,success_count=$3,failed_count=$4,error_log=$5,completed_at=NOW() WHERE id=$6`,
      ["completed", totalRows, successCount, failedCount, JSON.stringify(errorLog), jobId]
    );
  } catch (err) {
    errorLog.push(`Processing error: ${err.message}`);
    await pool.query(
      `UPDATE bulk_upload_jobs SET status='failed',error_log=$1,completed_at=NOW() WHERE id=$2`,
      [JSON.stringify(errorLog), jobId]
    );
  } finally {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
}

async function getDealerJob(jobId) {
  const res = await pool.query(
    `SELECT id,filename,status,total_rows,success_count,failed_count,error_log,created_at,completed_at
     FROM bulk_upload_jobs WHERE id=$1`,
    [jobId]
  );
  return res.rows[0] || null;
}

module.exports = { createDealerJob, processDealerUpload, getDealerJob };
