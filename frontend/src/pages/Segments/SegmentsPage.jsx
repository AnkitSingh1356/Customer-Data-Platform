import { useEffect, useState, useMemo } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { useSegments }       from "../../components/Segments/useSegments";
import SegmentModal          from "../../components/Segments/SegmentModal";
import DeleteConfirmModal    from "../../components/Segments/DeleteConfirmModal";
import Toast                 from "../../components/Segments/Toast";
import { getPermissions }    from "../../config/personaConfig";
import { useAuth }           from "../../auth/AuthContext";
import { useRBAC }           from "../../auth/RBACContext";
import Pagination from "../../components/common/Pagination";
import DataTable from "../../components/common/DataTable";
import KpiCard from "../../components/common/KpiCard";

const rulesLabel = (rules = []) => {
  if (!rules.length) return "No rules";
  return `${rules.length} condition${rules.length > 1 ? "s" : ""} (all)`;
};

const fmtNum = (n) => Number(n ?? 0).toLocaleString();

const SegmentsPage = ({ persona = "admin" }) => {
  const { user }          = useAuth();
  const { hasPermission } = useRBAC();
  const isAdmin = user?.role === "admin";

  // Admins use static persona config; customers use RBAC grants
  const perms = isAdmin
    ? getPermissions(persona, "segments")
    : {
        create: hasPermission("segments", "create"),
        edit:   hasPermission("segments", "update"),
        delete: hasPermission("segments", "delete"),
      };

  const [search,       setSearch]       = useState("");
  const debouncedSearch = useDebounce(search);
  const [filterStatus, setFilterStatus] = useState("");
  const [modal,        setModal]        = useState(null);
  const [selected,     setSelected]     = useState(null); 
  const [deleting,     setDeleting]     = useState(false);
  const [toast,        setToast]        = useState(null); 
  const [page, setPage] = useState(1);
const [limit, setLimit] = useState(5);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const { segments, stats, loading, error,
          createSegment, updateSegment, deleteSegment } = useSegments({
    search:  debouncedSearch,
    status:  filterStatus,
  });

  const openCreate = () => { setSelected(null); setModal("create"); };
  const openEdit   = (seg) => { setSelected(seg); setModal("edit"); };
  const openDelete = (seg) => { setSelected(seg); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleCreate = async (payload) => {
    await createSegment(payload);
    showToast("Segment created successfully.");
  };
  const handleEdit = async (payload) => {
    await updateSegment(selected.id, payload);
    showToast("Segment updated successfully.");
  };
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSegment(selected.id);
      showToast("Segment deleted.");
      closeModal();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const totalSegments   = fmtNum(stats?.total_segments   ?? segments.length);
  const activeCount     = stats?.active_count            ?? segments.filter((s) => s.status === "active").length;
  const totalMembers    = fmtNum(stats?.total_members    ?? 0);
  const avgSegmentSize  = fmtNum(stats?.avg_segment_size ?? 0);

  // Segments are filtered server-side but paginated client-side from the full result set
  const paginatedSegments = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;

    return segments.slice(start, end);
  }, [segments, page, limit]);

  const totalPages = Math.ceil(segments.length / limit) || 1;

  // Clamp the current page when filters shrink the total available pages
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const columns = [
    {
      key: "name",
      title: "Segment Name",
      cellClassName: "seg-td-name",
  
      render: (seg) => (
        <>
          <span className="seg-name">{seg.name}</span>
  
          {seg.description && (
            <span className="seg-desc">
              {seg.description}
            </span>
          )}
        </>
      ),
    },
  
    {
      key: "member_count",
      title: "Members",
      cellClassName: "seg-td-members",
  
      render: (seg) => fmtNum(seg.member_count),
    },
  
    {
      key: "status",
      title: "Status",
  
      render: (seg) => (
        <span className={`status-badge ${seg.status}`}>
  {seg.status}
</span>
      ),
    },
  
    {
      key: "rules",
      title: "Rules",
      cellClassName: "seg-td-rules",
  
      render: (seg) => rulesLabel(seg.rules),
    },
  
    {
      key: "activity_window",
      title: "Window",
  
      render: (seg) => (
        <span className="seg-window-pill">
          {seg.activity_window}
        </span>
      ),
    },
  
    {
      key: "created_at",
      title: "Created",
      cellClassName: "seg-td-date",
    },
  
    ...(perms.edit || perms.delete
      ? [
          {
            key: "actions",
            title: "Actions",
            cellClassName: "seg-td-actions",
  
            render: (seg) => (
              <>
                {perms.edit && (
                  <button
  className="seg-action-btn"
  onClick={() => openEdit(seg)}
  title="Edit segment"
>
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
</button>
                )}
  
                {perms.delete && (
                  <button
  className="seg-action-btn seg-action-delete"
  onClick={() => openDelete(seg)}
  title="Delete segment"
>
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
</button>
                )}
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="seg-page">
      <div className="seg-header">
        <div>
          <h1 className="seg-title">Segmentation Builder</h1>
          <p className="seg-subtitle">
            Create segments using product, behavioral, financial and dealer attributes — with dynamic activity windows.
          </p>
        </div>
        {perms.create && (
          <button className="seg-new-btn" onClick={openCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Segment
          </button>
        )}
      </div>

      <div className="seg-kpi-row">
        <KpiCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
            </svg>
          }
          label="TOTAL SEGMENTS"
          value={totalSegments}
          sub={`${activeCount} active`}
        />
        <KpiCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
          label="TOTAL MEMBERS"
          value={totalMembers}
        />
        <KpiCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
          }
          label="AVG. SEGMENT SIZE"
          value={avgSegmentSize}
        />
      </div>

      <div className="seg-toolbar">
        <div className="seg-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ba4bc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="seg-search-input"
            placeholder="Search segments..."
            value={search}
            onChange={(e) => {
  setPage(1);
  setSearch(e.target.value);
}}
          />
        </div>
        <select
          className="seg-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {error   && <div className="seg-error-banner">⚠ {error} — using local data.</div>}
      {loading && <div className="c360-loading">Loading segments…</div>}

      {!loading && (
  <>

    <DataTable
  columns={columns}
  data={paginatedSegments}
  loading={loading}
  wrapperClassName="table-wrapper"
  tableClassName="app-table"
  emptyClassName="seg-empty"
  emptyMessage={
    perms.create
      ? "No segments found. Click + New Segment to create one."
      : "No segments found."
  }
/>

    <Pagination
      page={page}
      totalPages={totalPages}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={setLimit}
    />
  </>
)}

      {modal === "create" && (
        <SegmentModal mode="create" onClose={closeModal} onSubmit={handleCreate} />
      )}
      {modal === "edit" && selected && (
        <SegmentModal mode="edit" segment={selected} onClose={closeModal} onSubmit={handleEdit} />
      )}
      {modal === "delete" && selected && (
        <DeleteConfirmModal
          segmentName={selected.name}
          onConfirm={handleDelete}
          onClose={closeModal}
          deleting={deleting}
        />
      )}

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SegmentsPage;
