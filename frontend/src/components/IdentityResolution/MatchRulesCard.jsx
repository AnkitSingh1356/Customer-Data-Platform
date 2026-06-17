// Displays identity-matching rules with their confidence scores.
// Each rule can be toggled active/inactive via onToggle(rule.id).
// When onToggle is omitted the toggles render as read-only indicators.
const MatchRulesCard = ({
    rules,
    onToggle,
  }) => {
    return (
      <div className="identity-card">
        <h2>
          Active Matching Rules
        </h2>

        {rules.map((rule) => (
          <div
            key={rule.id}
            className="rule-row"
          >
            <div>
              <p>{rule.rule_name}</p>
            </div>

            <div className="rule-right">
              <span>
                {
                  rule.confidence_score
                }
                % confidence
              </span>

              <div
                className={`rule-toggle ${rule.is_active ? "active" : ""} ${onToggle ? "ir-rule-card--clickable" : "ir-rule-card--static"}`}
                onClick={onToggle ? () => onToggle(rule.id) : undefined}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  export default MatchRulesCard;
