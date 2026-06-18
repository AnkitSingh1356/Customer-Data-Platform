const {
  getCustomerProfile,
  addFlexibleAttribute,
} = require("../services/profileService");


/**
 * Returns the full unified profile for a customer identified by their CDP ID.
 * Usage: Called by Express router on GET /api/profiles/:cdpId
 * @param {import('express').Request} req - req.params.cdpId: unique CDP customer identifier
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: profile object on success; 404 if not found; { error } on failure
 */
async function fetchProfile(req, res) {
  const { cdpId } = req.params;
  try {
    const profile = await getCustomerProfile(cdpId);
    if (!profile) return res.status(404).json({ error: "Customer not found." });
    return res.json(profile);
  } catch (err) {
    console.error("[Profile] fetchProfile error:", err.message);
    return res.status(500).json({ error: "Failed to fetch profile." });
  }
}
/**
 * Attaches a flexible key-value attribute to a profile, enabling custom data extension.
 * Usage: Called by Express router on POST /api/profiles/:cdpId/attributes
 * @param {import('express').Request} req - req.params.cdpId: customer ID; req.body: { attr_type, attr_key, attr_value }
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends 201 JSON: created attribute on success; 400 if key/value missing; { error } on failure
 */
async function createAttribute(req, res) {
  const { cdpId } = req.params;
  const { attr_type, attr_key, attr_value } = req.body;

  // Reject empty strings early to prevent polluting the attribute store
  if (!attr_key?.trim() || !attr_value?.trim()) {
    return res.status(400).json({ error: "attr_key and attr_value are required." });
  }
  try {
    const attr = await addFlexibleAttribute(cdpId, { attr_type, attr_key, attr_value });
    return res.status(201).json(attr);
  } catch (err) {
    console.error("[Profile] createAttribute error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { fetchProfile, createAttribute };
