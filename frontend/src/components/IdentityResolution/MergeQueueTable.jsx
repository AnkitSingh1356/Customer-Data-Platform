import { useState, useEffect } from "react";

// Formats ISO date strings for the "Detected on" column; returns "—" for nulls
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

// Renders potential duplicate customer pairs with per-row and bulk merge actions.
// Row identity is keyed on the customer_id + duplicate_customer_id pair because
// rows lack a single unique id field.
const MergeQueueTable = ({ rows, search, setSearch, onMerge, onBulkMerge }) => {
  const [selected, setSelected] = useState([]);

  // Reset selection whenever the displayed rows change (e.g. after a merge)
  useEffect(() => {
    setSelected([]);
  }, [rows]);

  const allSelected =
    rows.length > 0 &&
    rows.every((r) =>
      selected.some(
        (s) =>
          s.customer_id === r.customer_id &&
          s.duplicate_customer_id === r.duplicate_customer_id
      )
    );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected(rows);
    }
  };

  const toggleRow = (row) => {
    const exists = selected.some(
      (s) =>
        s.customer_id === row.customer_id &&
        s.duplicate_customer_id === row.duplicate_customer_id
    );
    if (exists) {
      setSelected((prev) =>
        prev.filter(
          (s) =>
            !(
              s.customer_id === row.customer_id &&
              s.duplicate_customer_id === row.duplicate_customer_id
            )
        )
      );
    } else {
      setSelected((prev) => [...prev, row]);
    }
  };

  // Matches by composite key since rows have no standalone unique id
  const isRowSelected = (row) =>
    selected.some(
      (s) =>
        s.customer_id === row.customer_id &&
        s.duplicate_customer_id === row.duplicate_customer_id
    );

  const handleBulkMerge = () => {
    if (onBulkMerge && selected.length > 0) {
      onBulkMerge(selected);
    }
  };

  return (
    <div className="identity-card ir-merge-table-wrap">
      <div className="table-header">
        <div>
          <h2>Merge Queue</h2>
          <p>Potential duplicates identified by the system.</p>
        </div>

        <div className="table-header-actions">
          {onBulkMerge && selected.some((r) => !r.action) && (
            <button className="merge-selected-btn" onClick={handleBulkMerge}>
              Merge Selected ({selected.filter((r) => !r.action).length})
            </button>
          )}
          <input
            type="text"
            placeholder="🔍 Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <table className="identity-table">
        <thead>
          <tr>
            {onMerge && (
              <th className="ir-merge-col-check">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
            )}
            <th>CUSTOMER</th>
            <th>DUPLICATE OF</th>
            <th>CONFIDENCE</th>
            <th>STATUS</th>
            <th>DETECTED ON</th>
            <th>ACTIONS</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => {
            const isMerged = row.action === "merged";
            const isDismissed = row.action === "dismissed";
            const isReview = row.action === "review";
            // Rows with no action value are still pending resolution
            const isPending = !row.action;

            // Map action state to display label and CSS modifier class
            let statusLabel = "Detected";
            let statusClass = "status-badge";
            if (isMerged) { statusLabel = "Merged"; statusClass = "status-badge status-badge-merged"; }
            else if (isDismissed) { statusLabel = "Dismissed"; statusClass = "status-badge status-badge-dismissed"; }
            else if (isReview) { statusLabel = "In Review"; statusClass = "status-badge status-badge-review"; }

            const score = Number(row.confidence_score) || 0;

            return (
              <tr key={index}>
                {onMerge && (
                  <td>
                    <input
                      type="checkbox"
                      checked={isRowSelected(row)}
                      onChange={() => toggleRow(row)}
                    />
                  </td>
                )}

                <td>
                  <div>
                    <strong>{row.customer_name}</strong>
                    <p className="ir-merge-cell-meta">
                      {row.customer_email}
                    </p>
                  </div>
                </td>

                <td>
                  <div>
                    <strong>{row.duplicate_name}</strong>
                    <p className="ir-merge-cell-meta">
                      {row.duplicate_email}
                    </p>
                  </div>
                </td>

                <td>
                  <div className="conf-bar-wrap">
                    <div className="conf-bar-track">
                      <div
                        className="conf-bar-fill"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span>{score}%</span>
                  </div>
                </td>

                <td>
                  <span className={statusClass}>{statusLabel}</span>
                </td>

                <td className="ir-merge-nowrap">
                  {formatDate(row.detected_on)}
                </td>

                <td>
                  {isPending && onMerge ? (
                    <button className="merge-btn" onClick={() => onMerge(row)}>
                      Merge
                    </button>
                  ) : (
                    <span className="ir-merge-empty">
                      {isMerged ? "Merged" : isDismissed ? "Dismissed" : isReview ? "In Review" : "—"}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MergeQueueTable;
