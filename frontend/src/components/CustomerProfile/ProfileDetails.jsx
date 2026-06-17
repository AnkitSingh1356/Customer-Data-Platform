// Null/empty values fall back to an em-dash to keep the grid visually consistent.
const Field = ({ label, value }) => (
  <div className="vp-field">
    <span className="vp-field-label">{label}</span>
    <span className="vp-field-value">{value || "—"}</span>
  </div>
);

// Renders the core contact/transactional fields for a customer.
// Lifetime value is formatted as USD currency; all other fields are raw strings.
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
