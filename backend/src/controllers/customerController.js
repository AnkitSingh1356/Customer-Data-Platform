const { getCustomers, getStats } = require("../services/customerService");

async function listCustomers(req, res) {
  const { type, status, source, search, page, limit } = req.query;
  try {
    const result = await getCustomers({
      type,
      status,
      source,
      search,
      page:  parseInt(page  || "1",  10),
      limit: parseInt(limit || "20", 10),
    });
    return res.json(result);
  } catch (err) {
    console.error("[Customers] listCustomers error:", err.message);
    return res.status(500).json({ error: "Failed to fetch customers." });
  }
}

async function getCustomerStats(req, res) {
  try {
    const stats = await getStats();
    return res.json(stats);
  } catch (err) {
    console.error("[Customers] getCustomerStats error:", err.message);
    return res.status(500).json({ error: "Failed to fetch stats." });
  }
}

module.exports = { listCustomers, getCustomerStats };
