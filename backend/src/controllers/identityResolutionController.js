const service = require(
  "../services/identityResolutionService",
);

// Returns identity resolution KPIs: match rate, merge count, unresolved duplicates
const getDashboard =
  async (req, res) => {
    try {
      const data =
        await service.getDashboard();

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(
        "Identity Dashboard Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch dashboard",
      });
    }
  };

// Returns paginated candidate duplicate pairs identified by the matching engine
const getMatches =
  async (req, res) => {
    try {
      const {
        search = "",
        page = 1,
        limit = 10,
      } = req.query;

      const data =
        await service.getMatches({
          search,
          page: Number(page),
          limit: Number(limit),
        });

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(
        "Identity Matches Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch matches",
      });
    }
  };

// Retrieves all identity matching rules (e.g., email exact-match, phone fuzzy-match)
const getRules =
  async (req, res) => {
    try {
      const data =
        await service.getRules();

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(
        "Identity Rules Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch rules",
      });
    }
  };

// Enables or disables a single matching rule without deleting its configuration
const toggleRule =
  async (req, res) => {
    try {
      const data =
        await service.toggleRule(
          req.params.id,
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(
        "Toggle Rule Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to toggle rule",
      });
    }
  };

// Merges two or more duplicate customer profiles into a single canonical record
const mergeProfiles =
  async (req, res) => {
    try {
      const data =
        await service.mergeProfiles(
          req.body,
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(
        "Merge Profiles Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to merge profiles",
      });
    }
  };

module.exports = {
  getDashboard,
  getMatches,
  getRules,
  toggleRule,
  mergeProfiles,
};
