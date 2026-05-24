//cdp-bulk-upload\sidebar-app\src\components\common\DataTable.jsx
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
