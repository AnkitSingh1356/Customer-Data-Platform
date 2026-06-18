import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Area,
  AreaChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  fetchOverview,
  fetchEngagement,
  fetchTopPages,
  fetchTrafficSources,
  fetchActivities,
  exportAnalytics,
} from "../../services/behavioralAnalyticsService";

import KpiCard from "../../components/common/KpiCard";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { useRBAC } from "../../auth/RBACContext";
import { CHART_COLORS } from '../../config/constants';

import "../../styles/behavioralAnalytics.css";

function BehavioralAnalyticsPage() {
  const { hasPermission } = useRBAC();
  // range drives all dashboard fetches; changing it also resets the activity page to 1
  const [range, setRange] = useState("30d");

  const [overview, setOverview] = useState(null);

  const [engagement, setEngagement] = useState([]);

  const [topPages, setTopPages] = useState([]);

  const [trafficSources, setTrafficSources] = useState([]);

  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);

  const [totalPages, setTotalPages] = useState(1);

  // 400 ms debounce prevents activity refetch on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when the date range changes so results stay coherent
  useEffect(() => {
    setPage(1);
  }, [range]);

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      setLoading(true);

      const [overviewData, engagementData, topPagesData, trafficData] =
        await Promise.all([
          fetchOverview(range),
          fetchEngagement(range),
          fetchTopPages(range),
          fetchTrafficSources(range),
        ]);

      setOverview(overviewData);

      // Slice raw engagement rows to match the selected range and attach
      // human-readable labels (weekday / day number / month+day) for the X axis
      const transformedEngagement = (() => {
        const raw = engagementData || [];

        let filtered = [];

        if (range === "7d") {
          filtered = raw.slice(-7);

          return filtered.map((item, index) => {
            const date = new Date();

            date.setDate(date.getDate() - (6 - index));

            return {
              ...item,
              label: date.toLocaleDateString("default", {
                weekday: "short",
              }),
            };
          });
        }

        if (range === "30d") {
          filtered = raw.slice(-30);

          return filtered.map((item, index) => {
            const date = new Date();

            date.setDate(date.getDate() - (29 - index));

            return {
              ...item,
              label: date.getDate(),
            };
          });
        }

        if (range === "90d") {
          filtered = raw.slice(-90);

          return filtered.map((item, index) => {
            const date = new Date();

            date.setDate(date.getDate() - (89 - index));

            return {
              ...item,
              label: date.toLocaleDateString("default", {
                month: "short",
                day: "numeric",
              }),
            };
          });
        }

        return raw;
      })();
      setEngagement(transformedEngagement);

      setTopPages(topPagesData || []);

      setTrafficSources(
        trafficData
          ? trafficData.map((d) => ({ ...d, value: Number(d.value) }))
          : [],
      );
    } catch (err) {
      console.error(err);

      setError("Failed to load analytics dashboard.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  // Activities are fetched separately so search/pagination doesn't reload charts
  const loadActivities = useCallback(async () => {
    try {
      const data = await fetchActivities({
        search: debouncedSearch,
        page,
        limit,
        range,
      });

      setActivities(data.rows || []);

      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    }
  }, [debouncedSearch, page, limit, range]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  async function handleExport() {
    try {
      const data = await exportAnalytics(range);

      if (!data?.length) {
        alert("No analytics data available.");
        return;
      }

      const headers = Object.keys(data[0]);

      const csvRows = [
        headers.join(","),

        ...data.map((row) =>
          headers.map((field) => JSON.stringify(row[field] ?? "")).join(","),
        ),
      ];

      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv",
      });

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = `behavioral-analytics-${Date.now()}.csv`;

      document.body.appendChild(a);

      a.click();

      document.body.removeChild(a);

      // Defer revocation to ensure the browser has started the download
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error(err);

      alert("Failed to export analytics.");
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "user",

        title: "USER",

        render: (row) => (
          <div className="ba-user-cell">
            <div className="ba-avatar">{row.initials}</div>

            <span>{row.user}</span>
          </div>
        ),
      },

      {
        key: "activity",

        title: "ACTIVITY",
      },

      {
        key: "device",

        title: "DEVICE",
      },

      {
        key: "location",

        title: "LOCATION",

        render: (row) => (row.location === ", " ? "-" : row.location),
      },

      {
        key: "timestamp",

        title: "TIMESTAMP",

        render: (row) => new Date(row.timestamp).toLocaleString(),
      },
    ],
    [],
  )
  if (loading) {
    return (
      <div className="ba-loading">
        <div className="ba-loader" />

        <span>Loading analytics...</span>
      </div>
    );
  }
  if (error) {
    return <div className="ba-error">{error}</div>;
  }

  return (
    <div className="behavioral-page">
      <div className="ba-header">
        <div>
          <h1>Behavioral Analytics</h1>

          <p>Track and analyze user engagement and platform activity.</p>
        </div>

        <div className="ba-header-actions">
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="7d">Last 7 Days</option>

            <option value="30d">Last 30 Days</option>

            <option value="90d">Last 90 Days</option>
          </select>

          {hasPermission('behavioral-analytics', 'export') && (
          <button className="ba-export-btn" onClick={handleExport}>
            Export Report
          </button>
          )}
        </div>
      </div>
      <div className="ba-kpi-grid">
        <KpiCard
          label="TOTAL SESSIONS"
          value={Number(overview?.total_sessions || 0).toLocaleString()}
          trend="+5.2%"
          trendType="up"
        />

        <KpiCard
          label="AVG SESSION DURATION"
          value={`${Number(
            overview?.avg_session_duration || 0,
          ).toLocaleString()}s`}
          trend="+2.1%"
          trendType="up"
        />

        <KpiCard
          label="BOUNCE RATE"
          value={`${Number(overview?.bounce_rate || 0).toLocaleString()}%`}
          trend="-1.5%"
          trendType="down"
        />

        <KpiCard
          label="CONVERSION RATE"
          value={`${Number(overview?.conversion_rate || 0).toLocaleString()}%`}
          trend="+3.9%"
          trendType="up"
        />
      </div>

      <div className="ba-card analytics-card">
        <div
          className="ba-card-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3>User Engagement</h3>
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#0EA5E9",
              backgroundColor: "#F0F9FF",
              padding: "6px 14px",
              borderRadius: "20px",
              border: "1px solid #E0F2FE",
            }}
          >
            {range === "7d"
              ? "Last 7 Days"
              : range === "30d"
                ? new Date().toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })
                : (() => {
                    const now = new Date();

                    const startMonth = new Date(
                      now.getFullYear(),
                      now.getMonth() - 2,
                      1,
                    ).toLocaleString("default", {
                      month: "short",
                    });

                    const endMonth = now.toLocaleString("default", {
                      month: "short",
                    });

                    return `${startMonth} - ${endMonth} ${now.getFullYear()}`;
                  })()}
          </span>
        </div>

        {engagement.length === 0 ? (
          <div className="ba-empty-state">
            No engagement analytics available.
          </div>
        ) : (
          <div className="ba-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={engagement}
                margin={{
                  top: 20,
                  right: 20,
                  left: -20,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="sessionsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0} />
                  </linearGradient>
                  <filter id="shadow" height="200%">
                    <feDropShadow
                      dx="0"
                      dy="6"
                      stdDeviation="6"
                      floodColor="#0EA5E9"
                      floodOpacity="0.2"
                    />
                  </filter>
                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "#94A3B8",
                  }}
                  dy={10}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "#94A3B8",
                  }}
                  dx={-10}
                />

                <Tooltip
                  cursor={{
                    stroke: "#CBD5E1",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow:
                      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    padding: "12px 16px",
                  }}
                  itemStyle={{ color: "#0F172A", fontWeight: "bold" }}
                  labelStyle={{ color: "#64748B", marginBottom: "6px" }}
                />

                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  fill="url(#sessionsGradient)"
                  activeDot={{
                    r: 6,
                    stroke: "#FFFFFF",
                    strokeWidth: 3,
                    fill: "#0EA5E9",
                  }}
                  style={{ filter: "url(#shadow)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="ba-grid">
        <div className="ba-card top-pages-card">
          <div className="ba-card-header">
            <h3>Top Pages by Views</h3>
          </div>

          {topPages.length === 0 ? (
            <div className="ba-empty-state">No page analytics available.</div>
          ) : (
            <div className="top-pages-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topPages}
                  layout="vertical"
                  margin={{
                    top: 0,
                    right: 10,
                    left: 20,
                    bottom: 0,
                  }}
                >
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 12,
                      fill: "#94A3B8",
                    }}
                  />

                  <YAxis
                    dataKey="page"
                    type="category"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 13,
                      fill: "#64748B",
                    }}
                  />

                  <Tooltip
                    formatter={(value) => Number(value).toLocaleString()}
                  />

                  <Bar dataKey="views" fill="#0EA5E9" radius={[6, 6, 6, 6]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="ba-card traffic-card">
          <div className="ba-card-header">
            <h3>Traffic Sources</h3>
          </div>

          {trafficSources.length === 0 ? (
            <div className="ba-empty-state">
              No traffic source data available.
            </div>
          ) : (
            <div className="traffic-content">
              <div className="traffic-chart-container">
                <PieChart width={340} height={340}>
                  <Pie
                    data={trafficSources}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {trafficSources.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </div>

              <div className="traffic-legend">
                {trafficSources.map((item, index) => (
                  <div className="traffic-legend-item" key={item.name}>
                    <div className="traffic-legend-left">
                      <span
                        className="traffic-dot"
                        style={{
                          background: CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />

                      <span>{item.name}</span>
                    </div>

                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="ba-card">
        <div className="ba-table-header">
          <h3>Recent User Activity</h3>

          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => {
              setPage(1);

              setSearch(e.target.value.trimStart());
            }}
          />
        </div>

        {activities.length === 0 ? (
          <div className="ba-empty-state">No activity found.</div>
        ) : (
          <DataTable columns={columns} data={activities} />
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </div>
  );
}

export default memo(BehavioralAnalyticsPage);
