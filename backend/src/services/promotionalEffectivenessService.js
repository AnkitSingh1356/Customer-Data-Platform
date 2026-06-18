const pool = require("../config/db");

/**
 * Returns cross-campaign KPIs: overall spend-to-budget ratio (used as ROI proxy),
 * total committed budget, active campaign count, and mean conversion rate.
 * Usage: Called by promotionalEffectivenessController.getOverview
 * @returns {Promise<{ overall_roi: string, total_budget: string, active_campaigns: string, avg_conversion: string }>}
 */
const getOverview = async () => {
  const query = `
    SELECT
      ROUND(
        (
          SUM(spent_amount) /
          NULLIF(SUM(total_budget), 0)
        ) * 100,
        1
      ) AS overall_roi,

      SUM(total_budget) AS total_budget,

      COUNT(*) FILTER (
        WHERE status = 'active'
      ) AS active_campaigns,

      ROUND(
        AVG(conversion_rate),
        1
      ) AS avg_conversion

    FROM promotional_campaigns
  `;

  const { rows } = await pool.query(query);

  return rows[0];
};

/**
 * Returns all campaigns ordered by budget descending for bar-chart rendering
 * of budget vs. spend per campaign.
 * Usage: Called by promotionalEffectivenessController.getBudgetPerformance
 * @returns {Promise<Array<{ id: number, campaign_name: string, total_budget: string, spent_amount: string }>>}
 */
const getBudgetPerformance = async () => {
  const query = `
    SELECT
      id,
      campaign_name,
      total_budget,
      spent_amount

    FROM promotional_campaigns

    ORDER BY total_budget DESC
  `;

  const { rows } = await pool.query(query);

  return rows;
};

/**
 * Returns campaign counts grouped by status for pie/donut chart consumption.
 * Usage: Called by promotionalEffectivenessController.getStatusDistribution
 * @returns {Promise<Array<{ name: string, value: number }>>} Status labels and counts
 */
const getStatusDistribution = async () => {
  const query = `
    SELECT
      status AS name,
      COUNT(*)::int AS value

    FROM promotional_campaigns

    GROUP BY status
  `;

  const { rows } = await pool.query(query);

  return rows;
};

/**
 * Returns filtered campaigns ordered by creation date descending.
 * Usage: Called by promotionalEffectivenessController.getCampaigns
 * @param {Object} opts - Filter options
 * @param {string} [opts.search] - Partial match on campaign_name
 * @param {string} [opts.status] - Filter by status ("all" disables the filter)
 * @returns {Promise<Array<Object>>} Campaign rows matching the filters
 */
const getCampaigns = async ({
  search,
  status,
}) => {
  let query = `
    SELECT *
    FROM promotional_campaigns
    WHERE 1 = 1
  `;

  const values = [];

  if (search) {
    values.push(`%${search}%`);

    query += `
      AND campaign_name ILIKE $${values.length}
    `;
  }

  if (
    status &&
    status !== "all"
  ) {
    values.push(status);

    query += `
      AND LOWER(status) = LOWER($${values.length})
    `;
  }

  query += `
    ORDER BY created_at DESC
  `;

  const { rows } =
    await pool.query(query, values);

  return rows;
};

/**
 * Fetches the full campaign list with all reportable fields for CSV export;
 * intentionally omits internal IDs and timestamps not needed in reports.
 * Usage: Called by promotionalEffectivenessController.exportCampaigns
 * @returns {Promise<Array<{ campaign_name, status, campaign_type, total_budget, spent_amount, audience_size, conversion_rate, start_date, end_date }>>}
 */
const exportCampaigns = async () => {
  const query = `
    SELECT
      campaign_name,
      status,
      campaign_type,
      total_budget,
      spent_amount,
      audience_size,
      conversion_rate,
      start_date,
      end_date

    FROM promotional_campaigns

    ORDER BY created_at DESC
  `;

  const { rows } = await pool.query(query);

  return rows;
};

module.exports = {
  getOverview,
  getCampaigns,
  getBudgetPerformance,
  getStatusDistribution,
  exportCampaigns,
};
