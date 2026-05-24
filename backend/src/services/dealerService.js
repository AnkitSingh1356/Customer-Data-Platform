//cdp-backend\src\services\dealerService.js
const pool = require("../config/db");
const csv = require("csv-parser");
const fs = require("fs");
async function getStats() {
  const res = await pool.query(`
    SELECT
      COUNT(*)                                              AS total_dealers,
      COUNT(*) FILTER (WHERE type = 'HQ')                  AS headquarters,
      COUNT(*) FILTER (WHERE type = 'Branch')              AS branch_locations,
      COALESCE(SUM(contacts), 0)                           AS contact_links,
      COALESCE(SUM(annual_revenue), 0)                     AS network_revenue
    FROM dealers
  `);
  return res.rows[0];
}

async function getHierarchy(search = "") {
  // NOTE: alias `d` is used in whereHQ, so the main HQ query must alias the table as `d`.
  let whereHQ = "WHERE d.parent_code IS NULL";
  const params = [];

  if (search) {
    whereHQ +=
      " AND (d.name ILIKE $1 OR d.code ILIKE $1 OR d.city ILIKE $1 OR d.region ILIKE $1)";
    params.push(`%${search}%`);
  }

  // Fetch all HQs matching search
  const hqRes = await pool.query(
    `SELECT id,name,code,parent_code,type,tier,region,city,country,
            contacts,annual_revenue,status
     FROM dealers d ${whereHQ} ORDER BY region, name`,
    params,
  );

  if (!hqRes.rows.length) return [];

  const hqCodes = hqRes.rows.map((r) => r.code);

  // Fetch all children of those HQs
  const branchRes = await pool.query(
    `SELECT id,name,code,parent_code,type,tier,region,city,country,
            contacts,annual_revenue,status
     FROM dealers
     WHERE parent_code = ANY($1::text[])
     ORDER BY parent_code, name`,
    [hqCodes],
  );

  // Group children under parents
  const childMap = {};
  for (const b of branchRes.rows) {
    if (!childMap[b.parent_code]) childMap[b.parent_code] = [];
    childMap[b.parent_code].push(b);
  }

  return hqRes.rows.map((hq) => ({
    ...hq,
    children: childMap[hq.code] ?? [],
  }));
}

/* ── Single dealer detail ───────────────────────────────────── */
async function getDealerDetail(code) {
  const dealerRes = await pool.query(
    `SELECT id,name,code,parent_code,type,tier,region,city,country,
            email,phone,status,data_owner,annual_revenue,contacts,steward_uuid
     FROM dealers WHERE code = $1`,
    [code],
  );
  if (!dealerRes.rows.length) return null;
  const dealer = dealerRes.rows[0];

  // Related dealers: parent + siblings
  const relatedRes = await pool.query(
    `SELECT d.name, d.code, d.city, d.region, d.tier,
            CASE
              WHEN d.code = $2 THEN 'Parent HQ'
              WHEN d.parent_code = $2 THEN 'Child'
              ELSE 'Sibling'
            END AS relation
     FROM dealers d
     WHERE (d.code = $2 OR (d.parent_code = $2) OR (d.parent_code = $3 AND d.code != $1))
       AND d.code != $1`,
    [code, dealer.parent_code ?? "", dealer.parent_code ?? ""],
  );

  // Assigned reps
  const repsRes = await pool.query(
    `SELECT name,title,region,email,phone,visits_30d,orders_30d,
            TO_CHAR(last_visit,'Mon D/YYYY') AS last_visit_fmt
     FROM dealer_reps WHERE dealer_code = $1 ORDER BY name`,
    [code],
  );

  // Access requests
  const accessRes = await pool.query(
    `SELECT target_uuid, status, TO_CHAR(created_at,'Mon DD, YYYY') AS requested_at
     FROM dealer_access_requests WHERE dealer_code = $1 ORDER BY created_at DESC`,
    [code],
  );

  // Sibling count for "related dealers" card
  const relatedDealers = relatedRes.rows;
  const assignedReps = repsRes.rows;
  const accessRequests = accessRes.rows;

  return {
    ...dealer,
    related_dealers: relatedDealers,
    assigned_reps: assignedReps,
    connected_accounts: [], // expandable in future
    access_requests: accessRequests,
  };
}

/* ── Submit access request ──────────────────────────────────── */
async function createAccessRequest(code, targetUuid) {
  if (!targetUuid?.trim())
    throw Object.assign(new Error("Target user UUID is required."), {
      status: 400,
    });
  const res = await pool.query(
    `INSERT INTO dealer_access_requests (dealer_code, target_uuid)
     VALUES ($1, $2) RETURNING *`,
    [code, targetUuid.trim()],
  );
  return res.rows[0];
}

async function bulkUpload(filePath) {
  const rows = [];

  return new Promise((resolve, reject) => {

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })

      .on("end", async () => {
        try {

          let inserted = 0;
          let failed = 0;

          for (const row of rows) {

            try {

              await pool.query(
                `
                INSERT INTO dealers (
                  name,
                  code,
                  parent_code,
                  type,
                  tier,
                  region,
                  city,
                  country,
                  email,
                  phone,
                  status
                )
                VALUES (
                  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
                )
                ON CONFLICT (code)
                DO NOTHING
                `,
                [
                  row.name,
                  row.code,
                  row.parent_code || null,
                  row.type || "Branch",
                  row.tier || "standard",
                  row.region,
                  row.city || null,
                  row.country || null,
                  row.email || null,
                  row.phone || null,
                  row.status || "Active",
                ]
              );

              inserted++;

            } catch {
              failed++;
            }
          }

          resolve({
            total: rows.length,
            inserted,
            failed,
          });

        } catch (e) {
          reject(e);
        }
      })

      .on("error", reject);
  });
}

module.exports = {
  getStats,
  getHierarchy,
  getDealerDetail,
  createAccessRequest,
  bulkUpload
};
