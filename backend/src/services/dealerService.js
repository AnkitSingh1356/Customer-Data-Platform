const pool = require("../config/db");
const csv = require("csv-parser");
const fs = require("fs");
/**
 * Returns network-wide aggregate stats: dealer counts by type, total contacts,
 * and combined annual revenue across all dealers.
 * Usage: Called by dealerController.getStats
 * @returns {Promise<{ total_dealers, headquarters, branch_locations, contact_links, network_revenue }>}
 */
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

/**
 * Builds a two-level dealer tree: HQ nodes with their branch children nested.
 * When search is provided, only matching HQs are returned but all their branches are included,
 * so the caller always receives complete subtrees.
 * Usage: Called by dealerController.getHierarchy
 * @param {string} [search=""] - Optional partial match on dealer name, code, city, or region
 * @returns {Promise<Array<Object>>} HQ dealer rows each with a `children` array of branch rows
 */
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

/**
 * Returns full detail for a single dealer including related dealers, assigned reps,
 * and pending access requests. Returns null when the code does not exist.
 * Usage: Called by dealerController.getDealerDetail
 * @param {string} code - The dealer's unique code identifier
 * @returns {Promise<Object|null>} Dealer record augmented with related_dealers, assigned_reps,
 *   connected_accounts, and access_requests arrays
 */
async function getDealerDetail(code) {
  const dealerRes = await pool.query(
    `SELECT id,name,code,parent_code,type,tier,region,city,country,
            email,phone,status,data_owner,annual_revenue,contacts,steward_uuid
     FROM dealers WHERE code = $1`,
    [code],
  );
  if (!dealerRes.rows.length) return null;
  const dealer = dealerRes.rows[0];

  // Resolve related dealers: the dealer's own parent (HQ), direct children,
  // and siblings (branches sharing the same parent), labelled by relation type.
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

/**
 * Submits a dealer data access request linking a dealer code to a target user UUID.
 * Usage: Called by dealerController.requestAccess
 * @param {string} code - Dealer code the request is filed against
 * @param {string} targetUuid - UUID of the user requesting access
 * @returns {Promise<Object>} The newly created dealer_access_requests row
 */
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

const DEALER_FORMULA_RE = /^[=+\-@\t\r]/;
/**
 * Guards against CSV injection by prefixing cells that start with formula characters
 * with a leading single-quote to neutralise them when opened in a spreadsheet.
 * Usage: Called within bulkUpload for each cell of every parsed row
 * @param {*} v - Raw cell value
 * @returns {string|*} Sanitized string value, or the original value if not a formula-like string
 */
function sanitizeDealerCell(v) {
  return typeof v === "string" && DEALER_FORMULA_RE.test(v) ? "'" + v : v;
}

const MAX_DEALER_ROWS = parseInt(process.env.MAX_ROWS_PER_UPLOAD || "10000");

/**
 * Parses a dealer CSV file, validates required fields, and upserts each row by dealer code.
 * Existing records are updated with non-null incoming values only (COALESCE preserves current
 * data when a CSV field is blank). Removes the temp file on completion.
 * Usage: Called by dealerController.bulkUpload
 * @param {string} filePath - Absolute path to the uploaded temp CSV file
 * @returns {Promise<{ total: number, inserted: number, failed: number, errors: Array<string> }>}
 */
async function bulkUpload(filePath) {
  const rows = [];
  const parseErrors = [];

  await new Promise((resolve, reject) => {
    let rowNum = 0;
    let stream = null;

    stream = fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
      .on("data", (raw) => {
        rowNum++;
        if (rowNum > MAX_DEALER_ROWS) {
          if (rowNum === MAX_DEALER_ROWS + 1) {
            parseErrors.push(`Exceeded max ${MAX_DEALER_ROWS} rows — remaining rows ignored.`);
            stream.destroy();
          }
          return;
        }

        if (!raw.name?.trim() || !raw.code?.trim()) {
          parseErrors.push(`Row ${rowNum}: Missing required field (name or code) — row skipped.`);
          return;
        }

        const row = {};
        for (const [k, v] of Object.entries(raw)) {
          row[k] = sanitizeDealerCell((v || "").trim());
        }
        row._rowNum = rowNum;
        rows.push(row);
      })
      .on("end",   resolve)
      .on("close", resolve)
      .on("error", (e) => { stream.destroy(); reject(e); });
  });

  let inserted = 0;
  let failed   = parseErrors.length;

  for (const row of rows) {
    try {
      await pool.query(
        `INSERT INTO dealers
           (name, code, parent_code, type, tier, region, city, country, email, phone, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (code) DO UPDATE SET
           name        = EXCLUDED.name,
           parent_code = COALESCE(EXCLUDED.parent_code, dealers.parent_code),
           type        = COALESCE(EXCLUDED.type,        dealers.type),
           tier        = COALESCE(EXCLUDED.tier,        dealers.tier),
           region      = COALESCE(EXCLUDED.region,      dealers.region),
           city        = COALESCE(EXCLUDED.city,        dealers.city),
           country     = COALESCE(EXCLUDED.country,     dealers.country),
           email       = COALESCE(EXCLUDED.email,       dealers.email),
           phone       = COALESCE(EXCLUDED.phone,       dealers.phone),
           status      = COALESCE(EXCLUDED.status,      dealers.status),
           updated_at  = NOW()`,
        [
          row.name, row.code, row.parent_code || null,
          row.type || "Branch", (row.tier || "standard").toLowerCase(),
          row.region || null, row.city || null, row.country || null,
          row.email || null, row.phone || null, row.status || "Active",
        ]
      );
      inserted++;
    } catch (e) {
      failed++;
      console.error(`[DealerBulkUpload] row ${row._rowNum} failed: ${e.message}`);
      parseErrors.push(`Row ${row._rowNum}: Insert failed — ${e.code === "23505" ? "duplicate code" : "database error"}.`);
    }
  }

  try { fs.unlinkSync(filePath); } catch (_) {}

  return {
    total:    rows.length + parseErrors.filter(e => e.includes("Missing required")).length,
    inserted,
    failed,
    errors:   parseErrors.slice(0, 200),
  };
}

module.exports = {
  getStats,
  getHierarchy,
  getDealerDetail,
  createAccessRequest,
  bulkUpload
};
