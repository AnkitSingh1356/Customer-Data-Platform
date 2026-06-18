/**
 * Generic table renderer driven by a columns configuration array.
 * Usage: Use anywhere a data table is needed; pass columns with optional render functions for custom cells.
 * @param {Object} props
 * @param {Array<{key: string, title: string, render?: function, headerClassName?: string, cellClassName?: string}>} props.columns - Column definitions; each may include a render(row) function for custom cell content
 * @param {Object[]} [props.data=[]] - Array of row objects to display
 * @param {boolean} [props.loading=false] - When true, suppresses the empty-state row
 * @param {string} [props.emptyMessage="No records found."] - Text shown when data is empty and not loading
 * @param {string} [props.tableClassName=""] - Additional CSS class applied to the table element
 * @param {string} [props.wrapperClassName=""] - Additional CSS class applied to the wrapper div
 * @param {string} [props.emptyClassName=""] - CSS class applied to the empty-state cell
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
  }) => {
    return (
        <div className={`table-wrapper ${wrapperClassName || ""}`}>
        <table className={`app-table ${tableClassName || ""}`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.headerClassName || ""}
                >
                  {col.title}
                </th>
              ))}
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
