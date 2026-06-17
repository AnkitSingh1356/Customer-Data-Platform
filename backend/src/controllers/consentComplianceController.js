const consentService = require("../services/consentComplianceService");

// Returns aggregated consent KPIs (opt-in rates, expiring consents, violations)
const getDashboardOverview = async (req, res) => {
  try {
    const data = await consentService.getDashboardOverview();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Consent Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch consent dashboard data",
    });
  }
};

// Returns paginated consent records; status filter supports: all, active, expired, revoked
const getConsentRecords = async (req, res) => {
  try {
    // Coerce page/limit to numbers; defaults ensure a safe first-page response
    const { search = "", status = "all", page = 1, limit = 10 } = req.query;

    const data = await consentService.getConsentRecords({
      search,
      status,
      page: Number(page),
      limit: Number(limit),
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Consent Records Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch consent records",
    });
  }
};

// Creates a new consent record; service validates required consent fields
const createConsentRecord = async (req, res) => {
  try {
    const created = await consentService.createConsentRecord(req.body);

    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    console.error("Create Consent Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create consent record",
    });
  }
};

// Updates an existing consent record (e.g., status change on withdrawal or renewal)
const updateConsentRecord = async (req, res) => {
  try {
    const updated = await consentService.updateConsentRecord(
      req.params.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Update Consent Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update consent record",
    });
  }
};

// Exports the full consent audit trail for regulatory reporting (GDPR/CCPA compliance)
const exportAuditLogs = async (req, res) => {
  try {
    const logs = await consentService.exportAuditLogs();

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Export Audit Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
    });
  }
};


// Bulk-exports all consent records (no pagination) for data portability requests
const exportConsentRecords = async (req, res) => {
  try {
    const records = await consentService.getAllConsentRecords();

    return res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to export consent records",
    });
  }
};

module.exports = {
  getDashboardOverview,
  getConsentRecords,
  createConsentRecord,
  updateConsentRecord,
  exportAuditLogs,
  exportConsentRecords,
};
