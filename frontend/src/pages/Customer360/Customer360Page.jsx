//sidebar-app\src\pages\Customer360\Customer360Page.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import BulkUploadModal from "../../components/BulkUpload/BulkUploadModal";
import CustomerProfileModal from "../../components/CustomerProfile/index.jsx";
import Pagination from "../../components/common/Pagination";
import DataTable from "../../components/common/DataTable";
import { BULK_UPLOAD_CONFIG } from "../../config/bulkUploadConfig";


const API = `${import.meta.env.VITE_API_BASE_URL}/api/customers`;

const DEFAULT_FILTERS = { type: "all", status: "all", source: "all" };

const INITIAL_STATS = {
  total_customers: 0,
  total_growth: 0,

  active_this_month: 0,
  new_this_week: 0,

  active_growth: 0,
  new_growth: 0,

  avg_lifetime_value: 0,
  avg_lifetime_growth: 0,
};

const Customer360Page = () => {
  const [showUploadModal,  setShowUploadModal]  = useState(false);
  const [selectedCdpId,    setSelectedCdpId]    = useState(null);
  const [customers,        setCustomers]        = useState([]);
  const [stats,            setStats]            = useState(INITIAL_STATS);
  const [loading,          setLoading]          = useState(false);
  const [search,           setSearch]           = useState("");
  const [debouncedSearch,  setDebouncedSearch]  = useState("");
  const [filters,          setFilters]          = useState(DEFAULT_FILTERS);
  const [page,             setPage]             = useState(1);
  const [limit,            setLimit]            = useState(5);
  const [total,            setTotal]            = useState(0);

  const totalPages = useMemo(
    () => Math.ceil(total / limit) || 1,
    [total, limit],
  );
  const formatGrowth = (value) => {
    if (value == null || isNaN(value)) return "0%";
  
    return `${Number(value).toFixed(1)}%`;
  };

  const resetFilters = () => {
    setSearch(""); setDebouncedSearch(""); setFilters(DEFAULT_FILTERS); setPage(1);
  };

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", limit);
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
      if (filters.type   !== "all") params.append("type",   filters.type);
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.source !== "all") params.append("source", filters.source);

      const [custRes, statsRes] = await Promise.all([
        fetch(`${API}?${params.toString()}`,  { signal: controller.signal }),
        fetch(`${API}/stats`,                  { signal: controller.signal }),
      ]);
      if (!custRes.ok || !statsRes.ok) throw new Error("API unavailable");

      const custData  = await custRes.json();
      const statsData = await statsRes.json();
      setCustomers(custData.customers || []);
      setTotal(custData.total || 0);
      setStats(statsData || INITIAL_STATS);
    } catch (err) {
      if (err.name !== "AbortError") console.error("[Customer360]", err.message);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [debouncedSearch, filters, page, limit]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleUploadClose = () => { setShowUploadModal(false); fetchCustomers(); };
  const columns = [
    {
      key: "checkbox",
      title: (
        <input type="checkbox" />
      ),
      headerClassName: "col-check",
      cellClassName: "col-check",
  
      render: () => (
        <input type="checkbox" />
      ),
    },
  
    {
      key: "cdp_id",
      title: "CDP ID",
      cellClassName: "td-cdp-id",
    },
  
    {
      key: "customer_name",
      title: "CUSTOMER NAME",
      cellClassName: "td-name",
    },
  
    {
      key: "customer_type",
      title: "CUSTOMER TYPE",
    },
  
    {
      key: "primary_source",
      title: "PRIMARY SOURCE",
    },
  
    {
      key: "status",
      title: "STATUS",
  
      render: (c) => (
        <span className={`status-badge ${c.status?.toLowerCase()}`}>
          {c.status}
        </span>
      ),
    },
  
    {
      key: "last_updated",
      title: "LAST UPDATED",
    },
  
    {
      key: "view",
      title: "VIEW",
  
      render: (c) => (
        <button
          className="btn-view-profile"
          onClick={() => setSelectedCdpId(c.cdp_id)}
        >
          View Profile
        </button>
      ),
    },
  ];

  return (
    <div className="c360-page">
      <div className="c360-header">
        <div>
          <h1 className="c360-title">Customer 360</h1>
          <p className="c360-subtitle">
            Unified customer profiles • Dealers, Retail Customers, Employees •
            Discovery &amp; Navigation
          </p>
        </div>
        <button
          className="btn-bulk-upload"
          onClick={() => setShowUploadModal(true)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>
          Bulk Upload
        </button>
      </div>

      <div className="c360-stats">
        <div className="stat-card">
          <p className="stat-label">Total Customers</p>
          <div className="stat-value-row">
            <span className="stat-value">{stats.total_customers}</span>

            <span className="stat-trend up">
              {formatGrowth(stats.total_growth)}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <p className="stat-label">Active This Month</p>
          <div className="stat-value-row">
            <span className="stat-value">{stats.active_this_month}</span>
            <span className="stat-trend up">
              {formatGrowth(stats.active_growth)}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <p className="stat-label">New This Week</p>
          <div className="stat-value-row">
            <span className="stat-value">{stats.new_this_week}</span>
            <span className="stat-trend up">
              {formatGrowth(stats.new_growth)}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg. Lifetime Value</p>
          <div className="stat-value-row">
            <span className="stat-value">
              $
              {Number(stats.avg_lifetime_value).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="stat-trend up">
              ↗ {formatGrowth(stats.avg_lifetime_growth)}
            </span>
          </div>
        </div>
      </div>

      <div className="c360-search-bar">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ba4bc"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by CDP ID, name, email, phone, dealer code..."
          className="c360-search-input"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <div className="c360-filters">
        <div className="filter-group">
          <label className="filter-label">Customer Type</label>
          <select
            className="filter-select"
            value={filters.type}
            onChange={(e) => updateFilter("type", e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="B2C Customer">B2C Customer</option>
            <option value="Employee">Employee</option>
            <option value="Dealer">Dealer</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Source System</label>
          <select
            className="filter-select"
            value={filters.source}
            onChange={(e) => updateFilter("source", e.target.value)}
          >
            <option value="all">All Sources</option>
            <option value="Commerce Cloud">Commerce Cloud</option>
            <option value="Paycom">Paycom</option>
            <option value="SAP">SAP</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Last Updated</label>
          <select className="filter-select">
            <option>Any Time</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </div>
        <button className="btn-apply-filters" onClick={fetchCustomers}>
          Apply Filters
        </button>
        <button className="btn-reset-filters" onClick={resetFilters}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.79" />
          </svg>
          Reset
        </button>
      </div>

      {/* ── Table bar ───────────────────────────────────────── */}
      <div className="c360-table-bar">
        <span className="c360-showing-text">
          Showing {customers.length} of {total} unified customer profiles
        </span>
        <div className="c360-table-actions">
          <button className="btn-table-action">Export List</button>
          <button className="btn-table-action">Manage Columns</button>
        </div>
      </div>

      {loading && <div className="c360-loading">Loading…</div>}

      {/* ── Table ───────────────────────────────────────────── */}
      <DataTable
  columns={columns}
  data={customers}
  loading={loading}
  wrapperClassName="table-wrapper"
  tableClassName="app-table"
  emptyClassName="c360-empty"
  emptyMessage="No customer records found."
/>

      <Pagination
  page={page}
  totalPages={totalPages}
  limit={limit}
  onPageChange={setPage}
  onLimitChange={setLimit}
/>
      {showUploadModal && (
  <BulkUploadModal
    onClose={handleUploadClose}
    config={BULK_UPLOAD_CONFIG.customers}
    onSuccess={fetchCustomers}
  />
)}

      {selectedCdpId && (
        <CustomerProfileModal
          cdpId={selectedCdpId}
          onClose={() => setSelectedCdpId(null)}
        />
      )}
    </div>
  );
};

export default Customer360Page;
