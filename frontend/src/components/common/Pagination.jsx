//cdp-bulk-upload\sidebar-app\src\components\common\Pagination.jsx
const Pagination = ({
    page,
    totalPages,
    limit,
    onPageChange,
    onLimitChange,
    limitOptions = [5, 10, 20, 50],
  }) => {
    return (
        <div className="app-pagination">
          <div className="pagination-left">
            <span className="pagination-label">Rows per page</span>
      
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="pagination-select"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
      
          <div className="pagination-right">
            <button
              className="pagination-btn"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </button>
      
            <span className="pagination-page">
              Page {page} of {totalPages}
            </span>
      
            <button
              className="pagination-btn"
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      );
    }
  export default Pagination;
