import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  import { useDebounce } from "../../hooks/useDebounce";
  
  import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
  } from "recharts";
  
  import {
    Eye,
  } from "lucide-react";
  
  import {
    fetchOverview,
    fetchCampaigns,
    fetchBudgetPerformance,
    fetchStatusDistribution,
    exportCampaigns,
  } from "../../services/promotionalEffectivenessService";
  
  import DataTable from "../../components/common/DataTable";
  
  import KpiCard from "../../components/common/KpiCard";
  
  import ExportButton from "../../components/common/ExportButton";
  import { useRBAC } from "../../auth/RBACContext";
  
import CampaignDetailsModal from "../../components/PromotionalEffectiveness/CampaignDetailsModal";

  import "../../styles/promotionalEffectiveness.css";
  
  const COLORS = [
    "#0EA5E9",
    "#0284C7",
    "#38BDF8",
    "#7DD3FC",
  ];
  
  function PromotionalEffectivenessPage() {
    const { hasPermission } = useRBAC();
    const [overview, setOverview] =
      useState({});
  
    const [campaigns, setCampaigns] =
      useState([]);
  
    const [budgetData, setBudgetData] =
      useState([]);
  
    const [statusData, setStatusData] =
      useState([]);
  
    const [search, setSearch] =
      useState("");
    const debouncedSearch = useDebounce(search);
    const [status, setStatus] =
      useState("all");
    const [
      selectedCampaign,
      setSelectedCampaign,
    ] = useState(null);
    useEffect(() => {
      loadDashboard();
    }, []);
    useEffect(() => {
      loadCampaigns();
    }, [debouncedSearch, status]);
  
    async function loadDashboard() {
      try {
        const [
          overviewData,
          budgetPerformance,
          distribution,
        ] = await Promise.all([
          fetchOverview(),
          fetchBudgetPerformance(),
          fetchStatusDistribution(),
        ]);
  
        setOverview(overviewData);
  
        setBudgetData(
          budgetPerformance,
        );
  
        setStatusData(distribution);
      } catch (error) {
        console.error(error);
      }
    }
  
    async function loadCampaigns() {
      try {
        const data =
          await fetchCampaigns({
            search: debouncedSearch,
            status,
          });
  
        setCampaigns(data);
      } catch (error) {
        console.error(error);
      }
    }
  
    async function handleExport() {
      try {
        const data =
          await exportCampaigns();
  
        const headers =
          Object.keys(data[0]);
  
        const csvRows = [
          headers.join(","),
  
          ...data.map((row) =>
            headers
              .map((field) =>
                JSON.stringify(
                  row[field] ?? "",
                ),
              )
              .join(","),
          ),
        ];
  
        const blob = new Blob(
          [csvRows.join("\n")],
          {
            type: "text/csv",
          },
        );
  
        const url =
          window.URL.createObjectURL(
            blob,
          );
  
        const a =
          document.createElement("a");
  
        a.href = url;
  
        a.download =
          "promotional-campaigns.csv";
  
        document.body.appendChild(a);
  
        a.click();
  
        document.body.removeChild(a);
      } catch (error) {
        console.error(error);
      }
    }
  
    const columns = useMemo(
      () => [
        {
          key: "campaign_name",
  
          title: "PROMOTION",
        },
  
        {
          key: "status",
  
          title: "STATUS",
  
          render: (row) => (
            <span
              className={`promo-status ${row.status}`}
            >
              {row.status}
            </span>
          ),
        },
  
        {
          key: "campaign_type",
  
          title: "TYPE",
        },
  
        {
          key: "budget",
  
          title: "BUDGET / SPENT",
  
          render: (row) => (
            <div>
              <div>
                $
                {Number(
                  row.spent_amount,
                ).toLocaleString()}
              </div>
  
              <small>
                of $
                {Number(
                  row.total_budget,
                ).toLocaleString()}
              </small>
            </div>
          ),
        },
  
        {
          key: "audience",
  
          title: "AUDIENCE",
  
          render: (row) =>
            Number(
              row.audience_size,
            ).toLocaleString(),
        },
  
        {
          key: "conversion",
  
          title: "CONVERSION",
  
          render: (row) =>
            row.conversion_rate
              ? `${row.conversion_rate}%`
              : "—",
        },
  
        {
          key: "dates",
  
          title: "DATES",
  
          render: (row) => (
            <div>
              <div>
                {row.start_date
                  ? new Date(
                      row.start_date,
                    ).toLocaleDateString()
                  : "—"}
              </div>
  
              <div>
                {row.end_date
                  ? new Date(
                      row.end_date,
                    ).toLocaleDateString()
                  : "—"}
              </div>
            </div>
          ),
        },
  
        {
          key: "actions",
  
          title: "",
  
          render: (row) => (
            <button
              className="promo-view-btn"
              onClick={() =>
                setSelectedCampaign(
                  row,
                )
              }
            >
              <Eye size={16} />
            </button>
          ),
        },
      ],
      [],
    );
  
    return (
      <div className="promo-page">
        <div className="promo-header">
          <div>
            <h1>
              Promotional
              Effectiveness
            </h1>
  
            <p>
              Analyze performance
              and ROI of your
              marketing promotions.
            </p>
          </div>
  
          {hasPermission('promotional', 'export') && (
          <ExportButton
            label="Export"
            onExport={handleExport}
            className="promo-export-btn"
          />
          )}
        </div>
  
        <div className="promo-kpi-grid">
          <KpiCard
            label="OVERALL ROI"
            value={`${overview.overall_roi || 0}%`}
            sub="Budget vs Spent"
          />
  
          <KpiCard
            label="TOTAL BUDGET"
            value={`$${Number(
              overview.total_budget || 0,
            ).toLocaleString()}`}
            sub="Campaign allocation"
          />
  
          <KpiCard
            label="ACTIVE CAMPAIGNS"
            value={
              overview.active_campaigns ||
              0
            }
            sub="Currently running"
          />
  
          <KpiCard
            label="AVG. CONVERSION"
            value={`${overview.avg_conversion || 0}%`}
            sub="Across all campaigns"
          />
        </div>
  
        <div className="promo-chart-grid">
          <div className="promo-card">
            <h3>
              Budget vs Spend by
              Campaign
            </h3>
  
            <ResponsiveContainer
              width="100%"
              height={320}
            >
              <BarChart
                data={budgetData}
              >
                <XAxis
                  dataKey="campaign_name"
                />
  
                <YAxis />
  
                <Tooltip />
  
                <Bar
                  dataKey="total_budget"
                  fill="#0EA5E9"
                />
  
                <Bar
                  dataKey="spent_amount"
                  fill="#38BDF8"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
  
          <div className="promo-card">
            <h3>
              Status Distribution
            </h3>
  
            <PieChart
              width={320}
              height={320}
            >
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
              >
                {statusData.map(
                  (
                    item,
                    index,
                  ) => (
                    <Cell
                      key={item.name}
                      fill={
                        COLORS[
                          index %
                            COLORS.length
                        ]
                      }
                    />
                  ),
                )}
              </Pie>
  
              <Tooltip />
            </PieChart>
          </div>
        </div>
  
        <div className="promo-card">
          <div className="promo-table-header">
            <h3>
              All Promotions
            </h3>
  
            <div className="promo-filters">
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value,
                  )
                }
              />
  
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value,
                  )
                }
              >
                <option value="all">
                  All Statuses
                </option>
  
                <option value="active">
                  Active
                </option>
  
                <option value="draft">
                  Draft
                </option>
  
                <option value="completed">
                  Completed
                </option>
              </select>
            </div>
          </div>
  
          <DataTable
            columns={columns}
            data={campaigns}
          />
        </div>
  
        <CampaignDetailsModal
          campaign={
            selectedCampaign
          }
          onClose={() =>
            setSelectedCampaign(
              null,
            )
          }
        />
      </div>
    );
  }
  
  export default PromotionalEffectivenessPage;
