/**
 * Displays identity-matching rules with their confidence scores and active/inactive toggles.
 * Usage: Render in the Identity Resolution page to show and manage matching rule configuration.
 * When onToggle is omitted, the toggle indicators are read-only.
 * @param {Object} props
 * @param {Array<{id: string|number, rule_name: string, confidence_score: number, is_active: boolean}>} props.rules - Array of identity matching rule objects
 * @param {function} [props.onToggle] - Optional callback invoked with rule.id when a toggle is clicked
 * @returns {JSX.Element}
 */
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
