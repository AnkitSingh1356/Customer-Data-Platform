import { useState } from "react";

// Initial form state; all three consent channels default to "none" (unset)
const defaultForm = {
  customer_name: "",
  customer_email: "",

  marketing_status: "none",
  analytics_status: "none",
  personalization_status: "none",

  source_system: "Web",
  consent_version: "v1",

  performed_by: "Admin",
};

const AddConsentModal = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] =
    useState(defaultForm);

  if (!open) return null;

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Native HTML validation (required/type="email") runs before this handler
    await onSubmit(form);
    // Reset to defaults so the form is clean if the modal is reopened
    setForm(defaultForm);
  }

  return (
    <div className="cc-modal-overlay">
      <div className="cc-modal">
        <div className="cc-modal-header">
          <h2>Add Consent Record</h2>

          <button onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cc-form-group">
            <label>Customer Name</label>

            <input
              type="text"
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="cc-form-group">
            <label>Customer Email</label>

            <input
              type="email"
              name="customer_email"
              value={form.customer_email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="cc-form-grid">
            <div className="cc-form-group">
              <label>
                Marketing
              </label>

              <select
                name="marketing_status"
                value={
                  form.marketing_status
                }
                onChange={handleChange}
              >
                <option value="none">
                  None
                </option>

                <option value="granted">
                  Granted
                </option>

                <option value="revoked">
                  Revoked
                </option>

                <option value="pending">
                  Pending
                </option>
              </select>
            </div>

            <div className="cc-form-group">
              <label>
                Analytics
              </label>

              <select
                name="analytics_status"
                value={
                  form.analytics_status
                }
                onChange={handleChange}
              >
                <option value="none">
                  None
                </option>

                <option value="granted">
                  Granted
                </option>

                <option value="revoked">
                  Revoked
                </option>

                <option value="pending">
                  Pending
                </option>
              </select>
            </div>

            <div className="cc-form-group">
              <label>
                Personalization
              </label>

              <select
                name="personalization_status"
                value={
                  form.personalization_status
                }
                onChange={handleChange}
              >
                <option value="none">
                  None
                </option>

                <option value="granted">
                  Granted
                </option>

                <option value="revoked">
                  Revoked
                </option>

                <option value="pending">
                  Pending
                </option>
              </select>
            </div>
          </div>

          <div className="cc-form-group">
            <label>Channel</label>

            <select
              name="source_system"
              value={form.source_system}
              onChange={handleChange}
            >
              <option value="Web">
                Web
              </option>

              <option value="Email">
                Email
              </option>

              <option value="App">
                App
              </option>

              <option value="In-Store">
                In-Store
              </option>
            </select>
          </div>

          <div className="cc-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cc-cancel-btn"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="cc-save-btn"
            >
              Create Consent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddConsentModal;
