const pool = require("../config/db");

// Normalises raw DB rows: ensures rules is always an array, coerces
// member_count to a number, and formats created_at for display.
const fmt = (rows) =>
  rows.map((r) => ({
    ...r,
    rules:       r.rules       ?? [],
    member_count: Number(r.member_count),
    created_at:  r.created_at
      ? new Date(r.created_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
      : null,
  }));

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

async function getSegment(id) {
  const res = await pool.query(
    `SELECT id, name, description, status, activity_window, match_type, rules, member_count, created_at
     FROM segments WHERE id = $1`,
    [id]
  );
  return res.rows.length ? fmt(res.rows)[0] : null;
}

// Persists a new segment with its filter rules serialised as JSONB.
// match_type controls whether rules are evaluated with AND ("all") or OR ("any").
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

async function deleteSegment(id) {
  const res = await pool.query("DELETE FROM segments WHERE id = $1 RETURNING id", [id]);
  return res.rows.length > 0;
}

module.exports = { getStats, listSegments, getSegment, createSegment, updateSegment, deleteSegment };
