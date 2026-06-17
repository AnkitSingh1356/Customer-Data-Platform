//frontend\src\components\consent-compliance\CompliancePolicies.jsx
const CompliancePolicies = ({
    policies = [],
  }) => {
    return (
      <div className="cc-policy-list">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className="cc-policy-card"
          >
            <div>
              <h4>{policy.policy_name}</h4>
  
              <p>
                Type: {policy.policy_type} · Updated:
                {" "}
                {new Date(
                  policy.updated_at
                ).toLocaleDateString()}
              </p>
            </div>
  
            <span className="cc-policy-badge">
              {policy.status}
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  export default CompliancePolicies;
