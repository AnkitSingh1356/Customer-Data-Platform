const SortIcon = ({ active, dir }) => (
  <span className="dt-sort-icon" aria-hidden="true">
    {active ? (dir === "asc" ? " ↑" : " ↓") : " ⇅"}
  </span>
);

/**
 * Generic table renderer driven by a columns configuration array.
 * Optionally supports sortable column headers via sortCol/sortDir/onSort props.
 * Usage: Use anywhere a data table is needed; pass columns with optional render functions for custom cells.
 * @param {Object} props
 * @param {Array<{key: string, title: string, render?: function, sortable?: boolean, headerClassName?: string, cellClassName?: string}>} props.columns - Column definitions
 * @param {Object[]} [props.data=[]] - Array of row objects to display
 * @param {boolean} [props.loading=false] - When true, suppresses the empty-state row
 * @param {string} [props.emptyMessage="No records found."] - Text shown when data is empty and not loading
 * @param {string} [props.tableClassName=""] - Additional CSS class applied to the table element
 * @param {string} [props.wrapperClassName=""] - Additional CSS class applied to the wrapper div
 * @param {string} [props.emptyClassName=""] - CSS class applied to the empty-state cell
 * @param {string|null} [props.sortCol=null] - Key of the currently sorted column
 * @param {string} [props.sortDir="asc"] - Current sort direction: "asc" or "desc"
 * @param {function|null} [props.onSort=null] - Called with column key when a sortable header is clicked
 * @returns {JSX.Element}
 */
const DataTable = ({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = "No records found.",
    tableClassName = "",
    wrapperClassName = "",
    emptyClassName = "",
    wrapperStyle = {},
    sortCol = null,
    sortDir = "asc",
    onSort = null,
  }) => {
    return (
        <div className={`table-wrapper ${wrapperClassName || ""}`} style={wrapperStyle}>
        <table className={`app-table ${tableClassName || ""}`}>
          <thead>
            <tr>
              {columns.map((col) => {
                const sortable = onSort && col.sortable !== false && col.key !== "actions";
                const isActive = sortCol === col.key;
                return (
                  <th
                    key={col.key}
                    className={col.headerClassName || ""}
                    onClick={sortable ? () => onSort(col.key) : undefined}
                    style={sortable ? { cursor: "pointer", userSelect: "none" } : undefined}
                  >
                    {col.title}
                    {sortable && <SortIcon active={isActive} dir={sortDir} />}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {!loading && data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className={emptyClassName}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={col.cellClassName || ""}
                  >
                    {col.render
                      ? col.render(row)
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  export default DataTable;
