const svc = require("../services/dealerService");
const fs = require("fs");
/**
 * Centralised error handler; propagates HTTP status from service-thrown errors.
 * @param {import('express').Response} res - Express response object
 * @param {Error & { status?: number }} e - The caught error, optionally carrying an HTTP status code
 * @param {string} [msg] - Fallback message if e.message is absent
 * @param {string} [context] - Label used in the console.error for log tracing
 * @returns {void}
 */
const err = (res, e, msg = "Server error", context = "") => {
  console.error("[DealerController]", context, e);
  return res.status(e?.status || 500).json({ error: e?.message || msg });
};

/**
 * Returns aggregate dealer metrics (counts by tier, region, status).
 * Usage: Called by Express router on GET /api/dealers/stats
 * @param {import('express').Request} req - No parameters used
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: stats object on success; { error } on failure
 */
async function stats(req, res) {
  try {
    return res.json(await svc.getStats());
  } catch (e) {
    return err(res, e);
  }
}

/**
 * Returns the parent-child dealer tree, optionally filtered by a search term.
 * Usage: Called by Express router on GET /api/dealers/hierarchy
 * @param {import('express').Request} req - req.query.search: optional text filter applied to dealer names/codes
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: hierarchical dealer tree on success; { error } on failure
 */
async function hierarchy(req, res) {
  try {
    return res.json(await svc.getHierarchy(req.query.search || ""));
  } catch (e) {
    return err(res, e);
  }
}

/**
 * Returns the full detail record for a single dealer identified by dealer code.
 * Usage: Called by Express router on GET /api/dealers/:code
 * @param {import('express').Request} req - req.params.code: unique dealer code
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: dealer detail object on success; 404 if not found; { error } on failure
 */
async function detail(req, res) {
  try {
    const d = await svc.getDealerDetail(req.params.code);
    if (!d) return res.status(404).json({ error: "Dealer not found." });
    return res.json(d);
  } catch (e) {
    return err(res, e);
  }
}

/**
 * Submits a request for a user to gain access to a specific dealer.
 * Usage: Called by Express router on POST /api/dealers/:code/access-request
 * @param {import('express').Request} req - req.params.code: dealer code; req.body.target_uuid: UUID of the user requesting access
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends 201 JSON: access request record on success; { error } on failure
 */
async function requestAccess(req, res) {
  try {
    const r = await svc.createAccessRequest(
      req.params.code,
      req.body.target_uuid,
    );
    return res.status(201).json(r);
  } catch (e) {
    return err(res, e);
  }
}
/**
 * Serves a pre-filled CSV template so importers know the expected dealer column schema.
 * Usage: Called by Express router on GET /api/dealers/template
 * @param {import('express').Request} req - No parameters used
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends a text/csv attachment: dealer_template.csv
 */
async function template(req, res) {
  try {
    const csv =
`name,code,parent_code,type,tier,region,city,country,email,phone,status
Dealer HQ,DLR-HQ-1,,HQ,gold,APAC,Tokyo,JP,test@test.com,9999999999,Active`;

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=dealer_template.csv"
    );

    res.setHeader("Content-Type", "text/csv");

    return res.send(csv);

  } catch (e) {
    return err(res, e);
  }
}
/**
 * Processes an uploaded CSV to create or update dealers in bulk.
 * Usage: Called by Express router on POST /api/dealers/bulk-upload
 * @param {import('express').Request} req - req.file: multipart CSV uploaded via multer
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: bulk upload result on success; 400 if no file; { error } on failure
 */
async function bulkUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "CSV file required.",
      });
    }

    const result = await svc.bulkUpload(req.file.path);
    return res.json(result);

  } catch (e) {
    return err(res, e);
  }
}
module.exports = {
  stats,
  hierarchy,
  detail,
  requestAccess,
  template,
  bulkUpload,
};
