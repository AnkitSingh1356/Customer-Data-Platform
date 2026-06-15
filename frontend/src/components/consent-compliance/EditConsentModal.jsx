const EditConsentModal = ({
    open,
    record,
    onClose,
    onToggle,
  }) => {
    if (!open || !record) return null;
  
    function nextStatus(status) {
      return status === "granted"
        ? "revoked"
        : "granted";
    }
  
    return (
      <div className="cc-modal-overlay">
        <div className="cc-modal">
          <div className="cc-modal-header">
            <div>
              <h2>
                Edit Consent —{" "}
                {record.customer_name}
              </h2>
  
              <p>
                {record.customer_email}
              </p>
            </div>
  
            <button onClick={onClose}>
              ×
            </button>
          </div>
  
          {[
            {
              key: "marketing_status",
              label: "Marketing",
            },
  
            {
              key: "analytics_status",
              label: "Analytics",
            },
  
            {
              key:
                "personalization_status",
  
              label:
                "Personalization",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="cc-consent-edit-card"
            >
              <div>
                <h4>{item.label}</h4>
  
                <p>
                  Status:{" "}
                  {record[item.key]}
                </p>
              </div>
  
              <button
                className={
                  record[item.key] ===
                  "granted"
                    ? "cc-revoke-btn"
                    : "cc-grant-btn"
                }
                onClick={() =>
                  onToggle(
                    item.key,
                    nextStatus(
                      record[item.key]
                    )
                  )
                }
              >
                {record[item.key] ===
                "granted"
                  ? "Revoke"
                  : "Grant"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default EditConsentModal;
