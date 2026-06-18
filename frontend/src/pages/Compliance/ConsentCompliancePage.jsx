import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRBAC } from "../../auth/RBACContext";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import KpiCard from "../../components/common/KpiCard";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import ExportButton from "../../components/common/ExportButton";
import Toast from "../../components/common/Toast";

import ConsentStatusBadge from "../../components/consent-compliance/ConsentStatusBadge";
import CompliancePolicies from "../../components/consent-compliance/CompliancePolicies";
import AddConsentModal from "../../components/consent-compliance/AddConsentModal";
import EditConsentModal from "../../components/consent-compliance/EditConsentModal";
import {
  fetchConsentDashboard,
  fetchConsentRecords,
  exportAuditLogs,
  exportConsentRecords,
  createConsentRecord,
  updateConsentRecord,
} from "../../services/consentComplianceService";

import { exportCsvFile } from "../../utils/exportCsv";

import "../../styles/consentCompliance.css";
import { CONSENT_CHART_COLORS } from '../../config/constants';

const ConsentCompliancePage = () => {
  // Pre-compute permission flags to conditionally show/hide action buttons
  const { hasPermission } = useRBAC();
  const canCreate = hasPermission('consent-compliance', 'create');
  const canUpdate = hasPermission('consent-compliance', 'update');
  const canExport = hasPermission('consent-compliance', 'export');
  const [overview, setOverview] = useState(null);

  const [policies, setPolicies] = useState([]);

  const [records, setRecords] = useState([]);

  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [tableLoading, setTableLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);

  const [totalPages, setTotalPages] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
  });

  // Ref holds the active toast timer so it can be cleared before showing a new toast
  const toastTimer = useRef(null);

  // Clear any pending toast timer on unmount to prevent state updates on dead component
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // 400 ms debounce on the customer search field before triggering a records refetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  async function handleAuditExport() {
    try {
      const logs = await exportAuditLogs();

      exportCsvFile({
        data: logs,
        filename: "audit-log.csv",
      });

      showToast("Audit log exported");
    } catch (error) {
      console.error(error);

      showToast("Failed to export audit logs");
    }
  }

  async function handleRecordsExport() {
    try {
      const records = await exportConsentRecords();

      exportCsvFile({
        data: records,
        filename: "consent-records.csv",
      });

      showToast("Consent records exported");
    } catch (error) {
      console.error(error);

      showToast("Failed to export consent records");
    }
  }

const showToast = useCallback((message) => {
  setToast({ visible: true, message });
  clearTimeout(toastTimer.current);
  toastTimer.current = setTimeout(() => {
    setToast({ visible: false, message: "" });
  }, 3000);
}, []);

const loadDashboard = useCallback(async () => {
  try {
    setDashboardLoading(true);

    const dashboardData = await fetchConsentDashboard();

    setOverview({
      consent_rate: dashboardData.kpis.overallConsentRate,

      pending: dashboardData.kpis.pendingRequests,

      active_policies: dashboardData.kpis.activePolicies,

      total_records: dashboardData.kpis.totalRecords,

      granted: dashboardData.kpis.granted,

      revoked: dashboardData.kpis.revoked,
    });

    setPolicies(dashboardData.policies || []);
  } catch (error) {
    console.error(error);

    showToast("Failed to load dashboard");
  } finally {
    setDashboardLoading(false);
  }
}, [showToast]);

const loadRecords = useCallback(async () => {
  try {
    setTableLoading(true);

    const response = await fetchConsentRecords({
      page,
      limit,
      search: debouncedSearch,
      status,
    });

    setRecords(response.rows || []);

    setTotalPages(response.totalPages || 1);
  } catch (error) {
    console.error(error);

    showToast("Failed to load records");
  } finally {
    setTableLoading(false);
  }
}, [page, limit, debouncedSearch, status, showToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

async function handleCreateConsent(payload) {
  try {
    await createConsentRecord(payload);

    showToast("Consent record created");

    setShowAddModal(false);

    loadDashboard();

    loadRecords();
  } catch (error) {
    console.error(error);

    showToast(error.message);
  }
}

// Cycles a single consent field through none→granted→revoked→pending on badge click
async function handleInlineToggle(row, field) {
  try {
    const states = ["none", "granted", "revoked", "pending"];
    const currentIndex = states.indexOf(row[field].toLowerCase());
    const nextStatus = states[(currentIndex + 1) % states.length];

    const updatedPayload = {
      marketing_status: row.marketing_status,
      analytics_status: row.analytics_status,
      personalization_status: row.personalization_status,
      [field]: nextStatus,
    };

    const updated = await updateConsentRecord(row.id, updatedPayload);

    setRecords((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );

    // If the modal is currently open and we clicked inline, we might want to update selectedRecord as well,
    // but the user's issue implies clicking inline when the modal is closed.
    if (selectedRecord && selectedRecord.id === updated.id) {
        setSelectedRecord(updated);
    }

    loadDashboard();

    const label = field.replace("_status", "").replace("_", " ");

    showToast(`${label} consent ${nextStatus}`);
  } catch (error) {
    console.error(error);

    showToast(error.message);
  }
}

async function handleToggleConsent(field, value) {
  try {
    const updatedPayload = {
      marketing_status: selectedRecord.marketing_status,

      analytics_status: selectedRecord.analytics_status,

      personalization_status: selectedRecord.personalization_status,

      [field]: value,
    };

    const updated = await updateConsentRecord(
      selectedRecord.id,
      updatedPayload,
    );

    setSelectedRecord(updated);

    setRecords((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );

    loadDashboard();

    const label = field.replace("_status", "").replace("_", " ");

    showToast(`${label} consent ${value}`);
  } catch (error) {
    console.error(error);

    showToast(error.message);
  }
}

async function handleExport() {
  try {
    const logs = await exportAuditLogs();

    exportCsvFile({
      data: logs,
      filename: "consent-audit-logs.csv",
    });

    showToast("Audit log exported");
  } catch (error) {
    console.error(error);

    showToast("Export failed");
  }
}

// Derived from overview KPIs so the pie chart always reflects the latest dashboard fetch
const chartData = useMemo(
  () => [
    {
      name: "Granted",
      value: overview?.granted || 0,
    },

    {
      name: "Revoked",
      value: overview?.revoked || 0,
    },

    {
      name: "Pending",
      value: overview?.pending || 0,
    },
  ],
  [overview],
);

const columns = useMemo(
  () => [
    {
      key: "customer_name",

      title: "USER",

      render: (row) => (
        <div className="cc-user-cell">
          <strong>{row.customer_name}</strong>

          <span>{row.customer_email}</span>
        </div>
      ),
    },

    {
      key: "marketing_status",

      title: "MARKETING",

      render: (row) => <ConsentStatusBadge status={row.marketing_status} onClick={canUpdate ? () => handleInlineToggle(row, "marketing_status") : undefined} />,
    },

    {
      key: "analytics_status",

      title: "ANALYTICS",

      render: (row) => <ConsentStatusBadge status={row.analytics_status} onClick={canUpdate ? () => handleInlineToggle(row, "analytics_status") : undefined} />,
    },

    {
      key: "personalization_status",

      title: "PERSONALIZATION",

      render: (row) => (
        <ConsentStatusBadge status={row.personalization_status} onClick={canUpdate ? () => handleInlineToggle(row, "personalization_status") : undefined} />
      ),
    },

    {
      key: "last_updated",

      title: "LAST UPDATED",

      render: (row) => new Date(row.last_updated).toLocaleDateString(),
    },

    {
      key: "actions",

      title: "ACTIONS",

      render: (row) => canUpdate ? (
        <button
          className="cc-edit-btn"
          onClick={() => {
            setSelectedRecord(row);
            setShowEditModal(true);
          }}
        >
          Edit
        </button>
      ) : null,
    },
  ],
  [canUpdate, canExport],
);

return (
  <div className="cc-page">
    <div className="cc-header">
      <div>
        <h1>Consent & Compliance Center</h1>

        <p>Manage user consent, compliance policies, and privacy workflows.</p>
      </div>

      <div className="cc-header-actions">
        {canCreate && (
        <button
          className="cc-primary-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add Consent
        </button>
        )}
        {canExport && (
        <ExportButton
          label="Export Audit Log"
          className="cc-secondary-btn"
          onExport={handleAuditExport}
        />
        )}
      </div>
    </div>

    <div className="cc-kpi-grid">
      <KpiCard
        label="OVERALL CONSENT RATE"
        value={`${overview?.consent_rate || 0}%`}
        sub={`${overview?.granted || 0} granted`}
      />

      <KpiCard
        label="PENDING REQUESTS"
        value={overview?.pending || 0}
        sub={`${overview?.revoked || 0} revoked`}
      />

      <KpiCard
        label="ACTIVE POLICIES"
        value={overview?.active_policies || 0}
        sub={`${policies.length} total`}
      />

      <KpiCard
        label="TOTAL RECORDS"
        value={overview?.total_records || 0}
        sub="All consent records"
      />
    </div>

    <div className="cc-grid">
      <div className="cc-card">
        <div className="cc-card-header">
          <h3>Consent Status Overview</h3>
        </div>

        <div className="cc-chart-wrap">
          {chartData.some((item) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={70}
                  outerRadius={110}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={CONSENT_CHART_COLORS[index]} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="cc-empty-state">No consent data available</div>
          )}
        </div>

        <div className="cc-chart-legend">
          {chartData.map((item, index) => (
            <div key={item.name} className="cc-legend-item">
              <span
                className="cc-dot"
                style={{
                  background: CONSENT_CHART_COLORS[index],
                }}
              />

              <span>
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="cc-card">
        <div className="cc-card-header">
          <h3>Active Compliance Policies</h3>
        </div>

        <CompliancePolicies policies={policies.slice(0, 4)} />
      </div>
    </div>

    <div className="cc-card">
      <div className="cc-table-toolbar">
        <h3>Consent Records by Customer</h3>

        <div className="cc-table-actions">
          <input
            type="text"
            placeholder="Search customer..."
            value={search}
            onChange={(e) => {
              setPage(1);

              setSearch(e.target.value);
            }}
          />

          <select
            value={status}
            onChange={(e) => {
              setPage(1);

              setStatus(e.target.value);
            }}
          >
            <option value="all">All Statuses</option>

            <option value="granted">Granted</option>

            <option value="revoked">Revoked</option>

            <option value="pending">Pending</option>
          </select>

          {canExport && (
          <ExportButton
            label="Export"
            className="cc-secondary-btn"
            onExport={handleRecordsExport}
          />
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={records}
        loading={tableLoading}
        emptyMessage="No consent records found."
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </div>

    <AddConsentModal
      open={showAddModal}
      onClose={() => setShowAddModal(false)}
      onSubmit={handleCreateConsent}
    />

    <EditConsentModal
      open={showEditModal}
      record={selectedRecord}
      onClose={() => setShowEditModal(false)}
      onToggle={handleToggleConsent}
    />

    <Toast visible={toast.visible} message={toast.message} />
  </div>
  );
};

export default ConsentCompliancePage;
