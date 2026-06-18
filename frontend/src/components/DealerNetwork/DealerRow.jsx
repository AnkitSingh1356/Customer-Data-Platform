//cdp-bulk-upload\sidebar-app\src\components\DealerNetwork\DealerRow.jsx
import { useState, memo } from "react";
import { tierClass, fmtRevenueTable, BuildingIcon, ChevronIcon } from "./dealerUtils";

/* ── Branch row (child) ──────────────────────────────────────── */
const BranchRow = memo(({ branch, onOpen }) => (
  <tr className="dn-branch-row" onClick={() => onOpen(branch.code)}>
    <td className="dn-td-expand" />
    <td className="dn-td-dealer dn-td-branch">
      <span className="dn-branch-icon"><BuildingIcon size={13} /></span>
      <span className="dn-branch-name">{branch.name}</span>
    </td>
    <td className="dn-td-code">{branch.code}</td>
    <td>{branch.region}</td>
    <td><span className={`dn-tier-pill ${tierClass(branch.tier)}`}>{branch.tier}</span></td>
    <td className="dn-td-num">{branch.contacts}</td>
    <td className="dn-td-num">{fmtRevenueTable(branch.annual_revenue)}</td>
  </tr>
));

/* ── HQ row (parent) ─────────────────────────────────────────── */
const DealerRow = memo(({ dealer, onOpen }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = dealer.children?.length > 0;

  return (
    <>
      <tr
        className={`dn-hq-row${expanded ? " dn-hq-row-expanded" : ""}`}
        onClick={() => onOpen(dealer.code)}
      >
        <td className="dn-td-expand">
          {hasChildren && (
            <button
              className="dn-expand-btn"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <ChevronIcon open={expanded} />
            </button>
          )}
        </td>
        <td className="dn-td-dealer">
          <span className="dn-hq-icon"><BuildingIcon size={14} /></span>
          <span className="dn-hq-name">{dealer.name}</span>
          <span className="dn-hq-badge">HQ</span>
        </td>
        <td className="dn-td-code">{dealer.code}</td>
        <td>{dealer.region}</td>
        <td><span className={`dn-tier-pill ${tierClass(dealer.tier)}`}>{dealer.tier}</span></td>
        <td className="dn-td-num">{dealer.contacts}</td>
        <td className="dn-td-num">{fmtRevenueTable(dealer.annual_revenue)}</td>
      </tr>

      {expanded && dealer.children?.map((branch) => (
        <BranchRow key={branch.code} branch={branch} onOpen={onOpen} />
      ))}
    </>
  );
});

export default DealerRow;
