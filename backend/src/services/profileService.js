const pool = require("../config/db");


/**
 * Assembles a full customer profile from four separate tables (customers, dealer_affiliations,
 * data_quality_issues, flexible_attributes) and returns a single merged object.
 * Returns null when the CDP ID does not exist.
 * Usage: Called by profileController.getCustomerProfile
 * @param {string} cdpId - The customer's CDP identifier (e.g. "CDP-A3F7B2C")
 * @returns {Promise<Object|null>} Merged profile object with dealer_affiliations, data_quality_issues,
 *   and flexible_attributes arrays, or null if not found
 */
async function getCustomerProfile(cdpId) {
  const custRes = await pool.query(
    `SELECT
       id, cdp_id,
       CONCAT(first_name, ' ', COALESCE(last_name,'')) AS full_name,
       first_name, last_name,
       email, phone,
       city, country, channel,
       customer_type, primary_source,
       total_orders, lifetime_value, consent_status,
       status, data_owner, quality_score,
       tags,
       TO_CHAR(updated_at, 'Mon DD, YYYY') AS last_updated,
       TO_CHAR(created_at, 'Mon DD, YYYY') AS created_date
     FROM customers
     WHERE cdp_id = $1`,
    [cdpId]
  );
  if (!custRes.rows.length) return null;
  const customer = custRes.rows[0];

  const affRes = await pool.query(
    `SELECT dealer_name, dealer_code, region, role
     FROM dealer_affiliations
     WHERE customer_id = $1
     ORDER BY id`,
    [customer.id]
  );

  // Only surface unresolved issues; severity ordering ensures HIGH issues
  // appear first regardless of insertion order.
  const issueRes = await pool.query(
    `SELECT title, description, severity
     FROM data_quality_issues
     WHERE customer_id = $1 AND resolved = FALSE
     ORDER BY
       CASE severity WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END`,
    [customer.id]
  );

  const attrRes = await pool.query(
    `SELECT attr_type, attr_key, attr_value
     FROM flexible_attributes
     WHERE customer_id = $1
     ORDER BY id`,
    [customer.id]
  );

  return {
    ...customer,
    dealer_affiliations:  affRes.rows,
    data_quality_issues:  issueRes.rows,
    flexible_attributes:  attrRes.rows,
  };
}


/**
 * Attaches an arbitrary key-value attribute to a customer profile, defaulting to the
 * "Behavioral" type when none is supplied.
 * Usage: Called by profileController.addFlexibleAttribute
 * @param {string} cdpId - The customer's CDP identifier
 * @param {Object} opts - Attribute data
 * @param {string} [opts.attr_type="Behavioral"] - Attribute category
 * @param {string} opts.attr_key - Attribute key name
 * @param {string} opts.attr_value - Attribute value
 * @returns {Promise<Object>} The newly created flexible_attributes row
 */
async function addFlexibleAttribute(cdpId, { attr_type, attr_key, attr_value }) {
  const custRes = await pool.query(
    "SELECT id FROM customers WHERE cdp_id = $1", [cdpId]
  );
  if (!custRes.rows.length) throw new Error("Customer not found");
  const customerId = custRes.rows[0].id;

  const res = await pool.query(
    `INSERT INTO flexible_attributes (customer_id, attr_type, attr_key, attr_value)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [customerId, attr_type || "Behavioral", attr_key, attr_value]
  );
  return res.rows[0];
}

/**
 * Returns the mean lifetime value across all customers with a positive LTV,
 * excluding zero-value records to avoid deflating the benchmark figure.
 * Usage: Called by profileController or dashboard aggregation routes
 * @returns {Promise<number>} Average lifetime value rounded to 2 decimal places
 */
async function getAvgLifetimeValue() {
  const res = await pool.query(
    `SELECT COALESCE(ROUND(AVG(lifetime_value)::numeric, 2), 0) AS avg_ltv
     FROM customers
     WHERE lifetime_value > 0`
  );
  return parseFloat(res.rows[0].avg_ltv);
}

module.exports = { getCustomerProfile, addFlexibleAttribute, getAvgLifetimeValue };
