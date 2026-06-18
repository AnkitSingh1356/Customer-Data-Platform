const svc = require("../services/segmentService");

/**
 * Uniform error responder for segment handlers; always sends 500 because segment errors are unexpected service failures.
 * @param {import('express').Response} res - Express response object
 * @param {Error} err - The caught error
 * @param {string} [msg] - Optional override message sent in the response body
 * @returns {void}
 */
const handleErr = (res, err, msg = "Server error") => {
  console.error("[Segments]", err.message);
  return res.status(500).json({ error: msg });
};

/**
 * Returns segment-level KPIs: total segments, active count, customer membership totals.
 * Usage: Called by Express router on GET /api/segments/stats
 * @param {import('express').Request} req - No parameters used
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: stats object on success; { error } on failure
 */
async function stats(req, res) {
  try { return res.json(await svc.getStats()); }
  catch (e) { return handleErr(res, e, "Failed to fetch stats."); }
}

/**
 * Lists segments with optional name search and status filter.
 * Usage: Called by Express router on GET /api/segments
 * @param {import('express').Request} req - req.query: { search, status (active|inactive|all) }
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: segment array on success; { error } on failure
 */
async function list(req, res) {
  try {
    const { search, status } = req.query;
    return res.json(await svc.listSegments({ search, status }));
  } catch (e) { return handleErr(res, e, "Failed to list segments."); }
}

/**
 * Returns a single segment by ID.
 * Usage: Called by Express router on GET /api/segments/:id
 * @param {import('express').Request} req - req.params.id: segment ID
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: segment object on success; 404 if not found; { error } on failure
 */
async function getOne(req, res) {
  try {
    const seg = await svc.getSegment(Number(req.params.id));
    if (!seg) return res.status(404).json({ error: "Segment not found." });
    return res.json(seg);
  } catch (e) { return handleErr(res, e, "Failed to fetch segment."); }
}

/**
 * Creates a new segment; validates the name here before rule evaluation occurs in the service.
 * Usage: Called by Express router on POST /api/segments
 * @param {import('express').Request} req - req.body: segment payload including name and rule definitions
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends 201 JSON: created segment on success; 400 if name missing; { error } on failure
 */
async function create(req, res) {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Segment name is required." });
  try { return res.status(201).json(await svc.createSegment(req.body)); }
  catch (e) { return handleErr(res, e, "Failed to create segment."); }
}

/**
 * Updates a segment definition; membership rules are re-evaluated on save via the service layer.
 * Usage: Called by Express router on PUT /api/segments/:id
 * @param {import('express').Request} req - req.params.id: segment ID; req.body: updated segment payload
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: updated segment on success; 400 if name missing; 404 if not found; { error } on failure
 */
async function update(req, res) {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Segment name is required." });
  try {
    const seg = await svc.updateSegment(Number(req.params.id), req.body);
    if (!seg) return res.status(404).json({ error: "Segment not found." });
    return res.json(seg);
  } catch (e) { return handleErr(res, e, "Failed to update segment."); }
}

/**
 * Deletes a segment by ID.
 * Usage: Called by Express router on DELETE /api/segments/:id
 * @param {import('express').Request} req - req.params.id: segment ID
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: { message } on success; 404 if not found; { error } on failure
 */
async function remove(req, res) {
  try {
    const ok = await svc.deleteSegment(Number(req.params.id));
    if (!ok) return res.status(404).json({ error: "Segment not found." });
    return res.json({ message: "Segment deleted." });
  } catch (e) { return handleErr(res, e, "Failed to delete segment."); }
}

module.exports = { stats, list, getOne, create, update, remove };
