const {
  getCustomerProfile,
  addFlexibleAttribute,
} = require("../services/profileService");


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
async function createAttribute(req, res) {
  const { cdpId } = req.params;
  const { attr_type, attr_key, attr_value } = req.body;

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
