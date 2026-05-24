export const RULE_FIELDS = [
  {
    group: "CUSTOMER",
    options: [
      { value: "country", label: "Country" },
      { value: "city", label: "City" },
      { value: "channel", label: "Channel" },
      { value: "customer_type", label: "Customer Type" },
      { value: "consent_status", label: "Consent Status" },
      { value: "data_owner", label: "Data Owner" },
      { value: "quality_score", label: "Data Quality Score" },
    ],
  },
  {
    group: "FINANCIAL / NUMERIC",
    options: [
      { value: "total_spend_ltv", label: "Total Spend (LTV)" },
      { value: "average_order_value", label: "Average Order Value" },
      { value: "credit_utilization", label: "Credit Utilization %" },
      { value: "inventory_volume", label: "Inventory Volume" },
    ],
  },
  {
    group: "DEALER",
    options: [
      { value: "dealer_tier", label: "Dealer · Tier" },
      { value: "dealer_region", label: "Dealer · Region" },
      { value: "dealer_type", label: "Dealer · Type (HQ/Branch)" },
      { value: "dealer_country", label: "Dealer · Country" },
      { value: "dealer_contact_role", label: "Dealer · Contact Role" },
      { value: "dealer_primary_contact", label: "Dealer · Primary Contact" },
    ],
  },
];

const TEXT_OPS = [
  { value: "equals", label: "Is" },
  { value: "not_equals", label: "Is not" },
  { value: "contains", label: "Contains" },
];

const NUMBER_OPS = [
  { value: "equals", label: "Is" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
  { value: "between", label: "Between" },
];

const NUMBER_FIELDS = new Set([
  "quality_score",
  "order_frequency",
  "total_spend_ltv",
  "average_order_value",
  "credit_utilization",
  "inventory_volume",
]);

const getOperators = (field) =>
  field && NUMBER_FIELDS.has(field) ? NUMBER_OPS : TEXT_OPS;

const emptyRule = () => ({ field: "", operator: "", value: "" });

const RuleRow = ({ rule, index, onChange, onRemove, showRemove }) => {
  const operators = getOperators(rule.field);

  const set = (key, val) => onChange(index, { ...rule, [key]: val });

  return (
    <div className="seg-rule-row">
      <select
        className="seg-rule-select"
        value={rule.field}
        onChange={(e) => set("field", e.target.value)}
      >
        <option value="">Field</option>

        {RULE_FIELDS.map((group) => (
          <optgroup key={group.group} label={group.group}>
            {group.options.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <select
        className="seg-rule-select"
        value={rule.operator}
        onChange={(e) => set("operator", e.target.value)}
        disabled={!rule.field}
      >
        <option value="">Operator</option>
        {operators.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <input
        className="seg-rule-value"
        placeholder="Value"
        value={rule.value}
        onChange={(e) => set("value", e.target.value)}
        disabled={!rule.operator}
      />

      {showRemove && (
        <button
          className="seg-rule-remove"
          onClick={() => onRemove(index)}
          aria-label="Remove condition"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

const RuleBuilder = ({ rules, matchType, onRulesChange, onMatchTypeChange }) => {
  const addRule   = () => onRulesChange([...rules, emptyRule()]);
  const removeRule = (i) => onRulesChange(rules.filter((_, idx) => idx !== i));
  const updateRule = (i, updated) => {
    const next = [...rules];
    next[i] = updated;
    onRulesChange(next);
  };

  return (
    <div className="seg-rule-builder">
      <div className="seg-rule-header">
        <div>
          <p className="seg-rule-title">Attribute Rules</p>
          <p className="seg-rule-subtitle">Combine product, behavioral, financial &amp; dealer attributes.</p>
        </div>
        <select
          className="seg-match-select"
          value={matchType}
          onChange={(e) => onMatchTypeChange(e.target.value)}
        >
          <option value="all">Match ALL</option>
          <option value="any">Match ANY</option>
        </select>
      </div>

      <div className="seg-rule-rows">
        {rules.map((rule, i) => (
          <RuleRow
            key={i}
            rule={rule}
            index={i}
            onChange={updateRule}
            onRemove={removeRule}
            showRemove={rules.length > 1}
          />
        ))}
      </div>

      <button className="seg-add-condition-btn" onClick={addRule}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Condition
      </button>
    </div>
  );
};

export { emptyRule };
export default RuleBuilder;
