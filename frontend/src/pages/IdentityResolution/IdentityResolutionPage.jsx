import {
  useEffect,
  useState,
} from "react";
import { useRBAC } from "../../auth/RBACContext";

import "../../styles/identity-resolution.css";

import KpiCard from "../../components/common/KpiCard";
import Pagination from "../../components/common/Pagination";

import MatchRulesCard from "../../components/IdentityResolution/MatchRulesCard";
import ResolutionStats from "../../components/IdentityResolution/ResolutionStats";
import MergeQueueTable from "../../components/IdentityResolution/MergeQueueTable";
import {
  getIdentityDashboard,
  getIdentityMatches,
  getIdentityRules,
  toggleIdentityRule,
  mergeProfiles,
} from "../../services/identityResolutionService";

const IdentityResolution = () => {
  const { hasPermission } = useRBAC();
  const canUpdate = hasPermission('identity-resolution', 'update');
  const [dashboard, setDashboard] =
    useState(null);

  const [rules, setRules] =
    useState([]);

  const [matches, setMatches] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState({
      total: 0,
      limit: 10,
    });

  // Dashboard KPIs and match rules load once on mount; they are refreshed
  // after any toggle or merge action to reflect the updated counts
  useEffect(() => {
    loadDashboard();
    loadRules();
  }, []);

  // Match queue refetches whenever page, search term, or page size changes
  useEffect(() => {
    loadMatches();
  }, [page, search, pagination.limit]);

  const loadDashboard =
    async () => {
      try {
        const data =
          await getIdentityDashboard();

        setDashboard(data);
      } catch (error) {
        console.error(error);
      }
    };

  const loadRules =
    async () => {
      try {
        const data =
          await getIdentityRules();

        const seen = new Set();
        setRules((data || []).filter(r => {
          if (seen.has(r.rule_name)) return false;
          seen.add(r.rule_name);
          return true;
        }));
      } catch (error) {
        console.error(error);
      }
    };

  const loadMatches =
    async () => {
      try {
        const data =
          await getIdentityMatches({
            search,
            page,
            limit: pagination.limit,
          });

        setMatches(data.rows);

        setPagination(prev => ({
          ...prev,
          total: data.total,
        }));
      } catch (error) {
        console.error(error);
      }
    };

  const handleRuleToggle =
    async (ruleId) => {
      try {
        await toggleIdentityRule(
          ruleId,
        );

        await loadRules();

        await loadDashboard();

        await loadMatches();
      } catch (error) {
        console.error(error);
      }
    };

  const handleMerge =
    async (row) => {
      try {
        await mergeProfiles({
          customerId:
            row.customer_id,

          duplicateId:
            row.duplicate_customer_id,

          confidenceScore:
            row.confidence_score,
        });

        await loadDashboard();

        await loadMatches();
      } catch (error) {
        console.error(error);
      }
    };

  // Only rows without a prior action are eligible; already-actioned rows are skipped
  const handleBulkMerge =
    async (selectedRows) => {
      try {
        const pending = selectedRows.filter((r) => !r.action);

        if (pending.length === 0) return;

        await Promise.all(
          pending.map((row) =>
            mergeProfiles({
              customerId: row.customer_id,
              duplicateId: row.duplicate_customer_id,
              confidenceScore: row.confidence_score,
            })
          )
        );

        await loadDashboard();

        await loadMatches();
      } catch (error) {
        console.error(error);
      }
    };

  return (
    <div className="identity-page">
      <div className="page-header">
        <div>
          <h1>
            Identity Resolution Center
          </h1>

          <p>
            Review, merge, and manage
            duplicate customer profiles.
          </p>
        </div>
      </div>

      <div className="identity-kpis">
        <KpiCard
          title="TOTAL DUPLICATES"
          value={
            dashboard?.totalDuplicates ||
            0
          }
        />

        <KpiCard
          title="MANUAL REVIEW QUEUE"
          value={
            dashboard?.needsReview ||
            0
          }
        />

        <KpiCard
          title="PROFILES MERGED"
          value={
            dashboard?.profilesMerged ||
            0
          }
        />

        <KpiCard
          title="AVG. CONFIDENCE"
          value={`${
            dashboard?.avgConfidence ||
            0
          }%`}
        />

        <KpiCard
          title="DISMISSED"
          value={
            dashboard?.dismissed ||
            0
          }
        />
      </div>

      <div className="identity-grid">
        <MatchRulesCard
          rules={rules}
          onToggle={canUpdate ? handleRuleToggle : undefined}
        />

        <ResolutionStats
          dashboard={dashboard}
        />
      </div>

      <MergeQueueTable
        search={search}
        setSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        rows={matches}
        onMerge={canUpdate ? handleMerge : undefined}
        onBulkMerge={canUpdate ? handleBulkMerge : undefined}
      />

      <Pagination
        page={page}
        totalPages={
          Math.ceil(pagination.total / pagination.limit) || 1
        }
        limit={
          pagination.limit
        }
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setPagination(prev => ({ ...prev, limit: newLimit }));
          setPage(1);
        }}
      />
    </div>
  );
};

export default IdentityResolution; 
