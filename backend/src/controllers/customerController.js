const { getCustomers, getStats } = require("../services/customerService");

// Returns paginated customer list; viewerRole/viewerCustomerType enforce row-level visibility
async function listCustomers(req, res) {
  const { type, status, source, search, page, limit } = req.query;
  try {
    const result = await getCustomers({
      type,
      status,
      source,
      search,
      page:               parseInt(page  || "1",  10),
      limit:              parseInt(limit || "20", 10),
      // Pass caller's identity so the service can scope results to permitted records
      viewerRole:         req.user.role,
      viewerCustomerType: req.user.customer_type,
    });
    return res.json(result);
  } catch (err) {
    console.error("[Customers] listCustomers error:", err.message);
    return res.status(500).json({ error: "Failed to fetch customers." });
  }
}

// Returns customer count summaries scoped to the caller's accessible records
async function getCustomerStats(req, res) {
  try {
    const stats = await getStats({
      viewerRole:         req.user.role,
      viewerCustomerType: req.user.customer_type,
    });
    return res.json(stats);
  } catch (err) {
    console.error("[Customers] getCustomerStats error:", err.message);
    return res.status(500).json({ error: "Failed to fetch stats." });
  }
}

module.exports = { listCustomers, getCustomerStats };
