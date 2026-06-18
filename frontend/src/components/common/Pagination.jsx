/**
 * Stateless pagination bar with a rows-per-page selector and previous/next navigation.
 * Usage: Place below a data table; the parent owns page/limit state and re-fetches data in the callbacks.
 * @param {Object} props
 * @param {number} props.page - Current page number (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.limit - Current rows-per-page value
 * @param {function} props.onPageChange - Callback invoked with the new page number
 * @param {function} props.onLimitChange - Callback invoked with the new limit value
 * @param {number[]} [props.limitOptions=[5, 10, 20, 50]] - Available rows-per-page options
 * @returns {JSX.Element}
 */
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
