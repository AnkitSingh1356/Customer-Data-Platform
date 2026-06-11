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
                className={`rule-toggle ${
                  rule.is_active
                    ? "active"
                    : ""
                }`}
                onClick={onToggle ? () => onToggle(rule.id) : undefined}
                style={{ cursor: onToggle ? "pointer" : "default" }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  export default MatchRulesCard;
