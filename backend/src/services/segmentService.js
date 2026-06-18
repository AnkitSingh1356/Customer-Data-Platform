const pool = require("../config/db");

/**
 * Normalises raw segment DB rows: ensures rules is always an array, coerces
 * member_count to a number, and formats created_at for display.
 * Usage: Applied to all query results before returning them to controllers
 * @param {Array<Object>} rows - Raw segment rows from the database
 * @returns {Array<Object>} Normalised segment rows
 */
const fmt = (rows) =>
  rows.map((r) => ({
    ...r,
    rules:       r.rules       ?? [],
    member_count: Number(r.member_count),
    created_at:  r.created_at
      ? new Date(r.created_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
      : null,
  }));

/**
 * Returns aggregate segment KPIs: total count, active count, total members, and average segment size.
 * Usage: Called by segmentController.getStats
 * @returns {Promise<{ total_segments: string, active_count: string, total_members: string, avg_segment_size: string }>}
 */
async function getStats() {
  const res = await pool.query(`
    SELECT
      COUNT(*)                                          AS total_segments,
      COUNT(*) FILTER (WHERE status = 'active')        AS active_count,
      COALESCE(SUM(member_count), 0)                   AS total_members,
      CASE WHEN COUNT(*) > 0
        THEN ROUND(SUM(member_count)::numeric / COUNT(*), 0)
        ELSE 0 END                                     AS avg_segment_size
    FROM segments
  `);
  return res.rows[0];
}

/**
 * Returns a filtered list of segments ordered by creation date descending.
 * Usage: Called by segmentController.getSegments
 * @param {Object} [opts={}] - Filter options
 * @param {string} [opts.search=""] - Partial match on segment name or description
 * @param {string} [opts.status=""] - Filter by status (empty string disables the filter)
 * @returns {Promise<Array<Object>>} Normalised segment rows
 */
async function listSegments({ search = "", status = "" } = {}) {
  const conditions = [];
  const params     = [];
  let p = 1;

  if (search) {
    conditions.push(`(name ILIKE $${p} OR description ILIKE $${p})`);
    params.push(`%${search}%`);
    p++;
  }
  if (status) {
    conditions.push(`status = $${p++}`);
    params.push(status);
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const res   = await pool.query(
    `SELECT id, name, description, status, activity_window, match_type, rules, member_count, created_at
     FROM segments ${where} ORDER BY created_at DESC`,
    params
  );
  return fmt(res.rows);
}

/**
 * Returns a single segment by primary key, or null if not found.
 * Usage: Called by segmentController.getSegmentById
 * @param {number} id - Segment primary key
 * @returns {Promise<Object|null>} Normalised segment row or null
 */
async function getSegment(id) {
  const res = await pool.query(
    `SELECT id, name, description, status, activity_window, match_type, rules, member_count, created_at
     FROM segments WHERE id = $1`,
    [id]
  );
  return res.rows.length ? fmt(res.rows)[0] : null;
}

/**
 * Persists a new segment with its filter rules serialised as JSONB.
 * match_type controls whether rules are evaluated with AND ("all") or OR ("any").
 * Usage: Called by segmentController.createSegment
 * @param {Object} opts - Segment definition
 * @param {string} opts.name - Required segment name
 * @param {string} [opts.description] - Optional description
 * @param {string} [opts.status="active"] - Segment status
 * @param {string} [opts.activity_window="All time"] - Time window for member matching
 * @param {string} [opts.match_type="all"] - Rule combination mode: "all" (AND) or "any" (OR)
 * @param {Array<Object>} [opts.rules=[]] - Filter rule objects serialised to JSONB
 * @returns {Promise<Object>} Normalised newly created segment row
 */
async function createSegment({ name, description, status, activity_window, match_type, rules }) {
  const res = await pool.query(
    `INSERT INTO segments (name, description, status, activity_window, match_type, rules)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      name.trim(),
      description?.trim() || null,
      status        || "active",
      activity_window || "All time",
      match_type    || "all",
      JSON.stringify(rules ?? []),
    ]
  );
  return fmt(res.rows)[0];
}

/**
 * Replaces all mutable fields on a segment; returns null if the ID does not exist.
 * Usage: Called by segmentController.updateSegment
 * @param {number} id - Segment primary key
 * @param {Object} opts - Updated segment definition (same shape as createSegment opts)
 * @param {string} opts.name - Segment name
 * @param {string} [opts.description] - Description
 * @param {string} [opts.status="active"] - Segment status
 * @param {string} [opts.activity_window="All time"] - Time window
 * @param {string} [opts.match_type="all"] - Rule combination mode
 * @param {Array<Object>} [opts.rules=[]] - Filter rule objects
 * @returns {Promise<Object|null>} Normalised updated segment row, or null if not found
 */
async function updateSegment(id, { name, description, status, activity_window, match_type, rules }) {
  const res = await pool.query(
    `UPDATE segments
     SET name            = $1,
         description     = $2,
         status          = $3,
         activity_window = $4,
         match_type      = $5,
         rules           = $6
     WHERE id = $7 RETURNING *`,
    [
      name.trim(),
      description?.trim() || null,
      status        || "active",
      activity_window || "All time",
      match_type    || "all",
      JSON.stringify(rules ?? []),
      id,
    ]
  );
  return res.rows.length ? fmt(res.rows)[0] : null;
}

/**
 * Deletes a segment by primary key and returns true if a row was deleted, false otherwise.
 * Usage: Called by segmentController.deleteSegment
 * @param {number} id - Segment primary key
 * @returns {Promise<boolean>} True if the segment was deleted, false if it did not exist
 */
async function deleteSegment(id) {
  const res = await pool.query("DELETE FROM segments WHERE id = $1 RETURNING id", [id]);
  return res.rows.length > 0;
}

module.exports = { getStats, listSegments, getSegment, createSegment, updateSegment, deleteSegment };
