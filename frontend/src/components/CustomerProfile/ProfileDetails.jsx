/**
 * Renders a single labelled field in the profile details grid.
 * Usage: Used internally by ProfileDetails; null/empty values fall back to an em-dash.
 * @param {Object} props
 * @param {string} props.label - Field label text (e.g. "Phone", "City")
 * @param {string|number} props.value - Field value; renders "—" when falsy
 * @returns {JSX.Element}
 */
const Field = ({ label, value }) => (
  <div className="vp-field">
    <span className="vp-field-label">{label}</span>
    <span className="vp-field-value">{value || "—"}</span>
  </div>
);

/**
 * Renders the core contact and transactional fields for a customer profile.
 * Usage: Rendered below the ProfileHeader inside the customer profile modal.
 * Lifetime value is formatted as USD currency; all other fields are raw strings.
 * @param {Object} props
 * @param {Object} props.profile - Customer profile with phone, city, country, channel, customer_type,
 *   total_orders, lifetime_value, and consent_status fields
 * @returns {JSX.Element}
 */
const ProfileDetails = ({ profile }) => (
  <div className="vp-fields-grid">
    <Field label="Phone"           value={profile.phone} />
    <Field label="City"            value={profile.city} />
    <Field label="Country"         value={profile.country} />
    <Field label="Channel"         value={profile.channel} />
    <Field label="Customer Type"   value={profile.customer_type} />
    <Field label="Total Orders"    value={profile.total_orders} />
    <Field
      label="Lifetime Value"
      value={profile.lifetime_value
        ? `$${Number(profile.lifetime_value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "—"}
    />
    <Field label="Consent Status"  value={profile.consent_status} />
  </div>
);

export default ProfileDetails;
