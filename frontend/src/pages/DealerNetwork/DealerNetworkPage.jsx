import { useState, useMemo, useEffect } from "react";

import { useDealers } from "../../components/DealerNetwork/useDealers";

import DealerRow from "../../components/DealerNetwork/DealerRow";

import DealerDetailModal from "../../components/DealerNetwork/DealerDetailModal";

import BulkUploadModal from "../../components/BulkUpload/BulkUploadModal";
import { useRBAC } from "../../auth/RBACContext";
import { BULK_UPLOAD_CONFIG } from "../../config/bulkUploadConfig";

import {
  fmtRevenue,
  fmtNum,
} from "../../components/DealerNetwork/dealerUtils";

const KpiCard = ({ icon, label, value }) => (
  <div className="dn-kpi-card">
    <div className="dn-kpi-top">
      <span className="dn-kpi-icon">{icon}</span>
      <span className="dn-kpi-label">{label}</span>
    </div>

    <div className="dn-kpi-value">{value}</div>
  </div>
);

const DealerNetworkPage = () => {
  const { hasPermission } = useRBAC();
  const [search, setSearch] = useState("");

  // liveSearch is the debounced value passed to useDealers; search is the raw input
  const [liveSearch, setLiveSearch] = useState("");

  const [selectedCode, setSelectedCode] = useState(null);

  const [showUploadModal, setShowUploadModal] =
    useState(false);

  /*
    Debounced search
    Prevents unnecessary API calls on every key stroke
  */
  useEffect(() => {
    const timer = setTimeout(() => {
      setLiveSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const {
    dealers,
    stats,
    loading,
    error,
    refetch,
  } = useDealers(liveSearch);

  // Memoized so KPI cards don't re-render on unrelated state changes (e.g. modal open)
  const kpis = useMemo(
    () => ({
      total: fmtNum(stats?.total_dealers ?? 0),

      hq: fmtNum(stats?.headquarters ?? 0),

      branches: fmtNum(
        stats?.branch_locations ?? 0
      ),

      contacts: fmtNum(
        stats?.contact_links ?? 0
      ),

      revenue: fmtRevenue(
        stats?.network_revenue ?? 0
      ),
    }),
    [stats]
  );

  return (
    <div className="dn-page">

      {/* HEADER */}

      <div className="dn-header">

        <div>
          <h1 className="dn-title">
            Dealer Network
          </h1>

          <p className="dn-subtitle">
            Multi-location dealer hierarchy •
            Contact-to-dealer relationships •
            Data ownership & governance
          </p>
        </div>

        {hasPermission('dealer-network', 'import') && (
        <button
          className="btn-bulk-upload"
          onClick={() =>
            setShowUploadModal(true)
          }
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

            <line
              x1="12"
              y1="12"
              x2="12"
              y2="21"
            />

            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>

          Bulk Upload
        </button>
        )}

      </div>

      {/* KPI ROW */}

      <div className="dn-kpi-row">

        <KpiCard
          icon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect
                x="2"
                y="7"
                width="20"
                height="14"
                rx="1"
              />

              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
          label="TOTAL DEALERS"
          value={kpis.total}
        />

        <KpiCard
          icon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
          label="HEADQUARTERS"
          value={kpis.hq}
        />

        <KpiCard
          icon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
              />

              <line
                x1="2"
                y1="12"
                x2="22"
                y2="12"
              />

              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          }
          label="BRANCH LOCATIONS"
          value={kpis.branches}
        />

        <KpiCard
          icon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />

              <circle
                cx="9"
                cy="7"
                r="4"
              />

              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          label="CONTACT LINKS"
          value={kpis.contacts}
        />

        <KpiCard
          icon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect
                x="1"
                y="4"
                width="22"
                height="16"
                rx="2"
              />

              <line
                x1="1"
                y1="10"
                x2="23"
                y2="10"
              />
            </svg>
          }
          label="NETWORK REVENUE"
          value={kpis.revenue}
        />

      </div>

      {/* SEARCH */}

      <div className="dn-search-bar">

        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ba4bc"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle
            cx="11"
            cy="11"
            r="8"
          />

          <line
            x1="21"
            y1="21"
            x2="16.65"
            y2="16.65"
          />
        </svg>

        <input
          className="dn-search-input"
          placeholder="Search by dealer name, code, city, region..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      {/* ERROR */}

      {error && (
        <div className="seg-error-banner">
          ⚠ {error}
        </div>
      )}

      {/* TABLE */}

      <div className="dn-table-wrap">

        <table className="dn-table">

          <thead>
            <tr>
              <th className="dn-th-expand" />

              <th>DEALER</th>

              <th>CODE</th>

              <th>REGION</th>

              <th>TIER</th>

              <th className="dn-th-num">
                CONTACTS
              </th>

              <th className="dn-th-num">
                REVENUE
              </th>
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td
                  colSpan="7"
                  className="dn-empty"
                >
                  Loading dealers...
                </td>
              </tr>
            )}

            {!loading &&
              dealers.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="dn-empty"
                  >
                    No dealers found.
                  </td>
                </tr>
              )}

            {!loading &&
              dealers.map((dealer) => (
                <DealerRow
                  key={dealer.code}
                  dealer={dealer}
                  onOpen={setSelectedCode}
                />
              ))}

          </tbody>

        </table>

      </div>

      {/* DETAIL MODAL */}

      {selectedCode && (
        <DealerDetailModal
          code={selectedCode}
          onClose={() =>
            setSelectedCode(null)
          }
        />
      )}

      {/* BULK UPLOAD MODAL */}

      {showUploadModal && (
        <BulkUploadModal
          onClose={() =>
            setShowUploadModal(false)
          }
          config={
            BULK_UPLOAD_CONFIG.dealers
          }
          onSuccess={() => {
            setShowUploadModal(false);

            refetch?.();
          }}
        />
      )}

    </div>
  );
};

export default DealerNetworkPage;
