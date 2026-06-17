const svc = require("../services/segmentService");

// Uniform error response; always 500 because segment errors are unexpected service failures
const handleErr = (res, err, msg = "Server error") => {
  console.error("[Segments]", err.message);
  return res.status(500).json({ error: msg });
};

// Returns segment-level KPIs: total segments, active count, customer membership totals
async function stats(req, res) {
  try { return res.json(await svc.getStats()); }
  catch (e) { return handleErr(res, e, "Failed to fetch stats."); }
}

// Lists segments with optional name search and status filter (active/inactive/all)
async function list(req, res) {
  try {
    const { search, status } = req.query;
    return res.json(await svc.listSegments({ search, status }));
  } catch (e) { return handleErr(res, e, "Failed to list segments."); }
}

async function getOne(req, res) {
  try {
    const seg = await svc.getSegment(Number(req.params.id));
    if (!seg) return res.status(404).json({ error: "Segment not found." });
    return res.json(seg);
  } catch (e) { return handleErr(res, e, "Failed to fetch segment."); }
}

// Creates a new segment; name is validated here before the rule evaluation in the service
async function create(req, res) {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Segment name is required." });
  try { return res.status(201).json(await svc.createSegment(req.body)); }
  catch (e) { return handleErr(res, e, "Failed to create segment."); }
}

// Updates segment definition; re-evaluates membership rules on save via the service layer
async function update(req, res) {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Segment name is required." });
  try {
    const seg = await svc.updateSegment(Number(req.params.id), req.body);
    if (!seg) return res.status(404).json({ error: "Segment not found." });
    return res.json(seg);
  } catch (e) { return handleErr(res, e, "Failed to update segment."); }
}

async function remove(req, res) {
  try {
    const ok = await svc.deleteSegment(Number(req.params.id));
    if (!ok) return res.status(404).json({ error: "Segment not found." });
    return res.json({ message: "Segment deleted." });
  } catch (e) { return handleErr(res, e, "Failed to delete segment."); }
}

module.exports = { stats, list, getOne, create, update, remove };
