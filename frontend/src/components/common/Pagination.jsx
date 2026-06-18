import SelectDropdown from "./SelectDropdown";

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
            <SelectDropdown
              value={String(limit)}
              onChange={(val) => onLimitChange(Number(val))}
              options={limitOptions.map((size) => ({ value: String(size), label: String(size) }))}
            />
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
