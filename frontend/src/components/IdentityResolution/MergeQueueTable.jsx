import { useState, useEffect } from "react";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const MergeQueueTable = ({ rows, search, setSearch, onMerge, onBulkMerge }) => {
  const [selected, setSelected] = useState([]);

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
    <div className="identity-card" style={{ marginTop: 24 }}>
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
              <th style={{ width: 40 }}>
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
            const isPending = !row.action;

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
                    <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                      {row.customer_email}
                    </p>
                  </div>
                </td>

                <td>
                  <div>
                    <strong>{row.duplicate_name}</strong>
                    <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
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

                <td style={{ whiteSpace: "nowrap", color: "#6b7280", fontSize: 13 }}>
                  {formatDate(row.detected_on)}
                </td>

                <td>
                  {isPending && onMerge ? (
                    <button className="merge-btn" onClick={() => onMerge(row)}>
                      Merge
                    </button>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: 13 }}>
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
