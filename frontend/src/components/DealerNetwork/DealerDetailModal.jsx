//cdp-bulk-upload\sidebar-app\src\components\DealerNetwork\DealerDetailModal.jsx
import { useState, useEffect, useCallback } from "react";
import { fetchDealerDetail, submitAccessRequest } from "./useDealers";
import { fmtRevenueTable, tierClass, BuildingIcon } from "./dealerUtils";

/* ── Collapsible section wrapper ─────────────────────────────── */
const Section = ({ icon, title, count, badge, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="dn-detail-section">
      <button className="dn-detail-section-hdr" onClick={() => setOpen((v) => !v)}>
        <span className="dn-detail-section-left">
          <span className="dn-detail-section-icon">{icon}</span>
          <span className="dn-detail-section-title">{title}</span>
          {count !== undefined && (
            <span className="dn-detail-section-count">({count})</span>
          )}
          {badge && <span className="dn-detail-section-badge">{badge}</span>}
        </span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`icon-chevron${open ? " icon-chevron--open" : ""}`}>
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>
      {open && <div className="dn-detail-section-body">{children}</div>}
    </div>
  );
};

/* ── Related Dealer row ──────────────────────────────────────── */
const RelatedDealerRow = ({ d }) => (
  <div className="dn-related-row">
    <div className="dn-related-left">
      <span className="dn-related-icon"><BuildingIcon size={13} /></span>
      <div>
        <p className="dn-related-name">{d.name}</p>
        <p className="dn-related-meta">
          {[d.code, d.city, d.region].filter(Boolean).join(" \u2022 ")}
        </p>
      </div>
    </div>
    <div className="dn-related-tags">
      {d.relation && <span className="dn-relation-tag">{d.relation}</span>}
      <span className={`dn-tier-pill ${tierClass(d.tier)} text-capitalize`}>
        {d.tier ? d.tier.charAt(0).toUpperCase() + d.tier.slice(1) : "—"}
      </span>
    </div>
  </div>
);

/* ── Assigned Rep row ────────────────────────────────────────── */
const RepRow = ({ r }) => (
  <div className="dn-rep-row">
    <div className="dn-rep-left">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      <div>
        <p className="dn-rep-name">{r.name}</p>
        <p className="dn-rep-meta">{[r.title, r.region].filter(Boolean).join(" \u2022 ")}</p>
        <p className="dn-rep-contact">
          {r.email && (
            <span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {r.email}
            </span>
          )}
          {r.phone && (
            <span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.29 6.29l.83-.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>
              </svg>
              {r.phone}
            </span>
          )}
        </p>
      </div>
    </div>
    <div className="dn-rep-right">
      <span className="dn-rep-period">LAST 30D</span>
      <span className="dn-rep-stats">{r.visits_30d} visits • {r.orders_30d} orders</span>
      <span className="dn-rep-last">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Last visit {r.last_visit_fmt}
      </span>
    </div>
  </div>
);

/* ── Access & Stewardship section ────────────────────────────── */
const AccessStewardship = ({ dealer, onRequestSent }) => {
  const [uuid,    setUuid]    = useState("");
  const [sending, setSending] = useState(false);
  const [err,     setErr]     = useState("");
  // Initialise local list from dealer prop; updated optimistically after submit
  const [reqs,    setReqs]    = useState(dealer.access_requests ?? []);

  // Validates UUID input, submits access request, and prepends result locally
  const handleRequest = async () => {
    if (!uuid.trim()) { setErr("Please enter a target user UUID."); return; }
    setSending(true); setErr("");
    try {
      const r = await submitAccessRequest(dealer.code, uuid.trim());
      setReqs((prev) => [{ ...r, requested_at: "Just now" }, ...prev]);
      setUuid("");
      onRequestSent?.();
    } catch (e) { setErr(e.message); }
    finally { setSending(false); }
  };

  return (
    <div className="dn-steward-section">
      <div className="dn-steward-header">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00b8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span className="dn-steward-title">Access &amp; Stewardship</span>
      </div>
      <p className="dn-steward-current">
        Current steward: <strong>{dealer.steward_uuid || "Unassigned"}</strong>
      </p>
      <div className="dn-steward-request-row">
        <input
          className="dn-steward-input"
          placeholder="Target user UUID"
          value={uuid}
          onChange={(e) => setUuid(e.target.value)}
        />
        <button className="dn-steward-btn" onClick={handleRequest} disabled={sending}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {sending ? "Sending…" : "Request"}
        </button>
      </div>
      {err && <p className="dn-steward-err">{err}</p>}
      {reqs.length === 0
        ? <p className="dn-empty-text">No access requests yet</p>
        : reqs.map((r, i) => (
            <div key={i} className="dn-access-req-row">
              <span className="dn-access-uuid">{r.target_uuid}</span>
              <span className={`dn-access-status dn-access-${r.status}`}>{r.status}</span>
              <span className="dn-access-date">{r.requested_at}</span>
            </div>
          ))
      }
    </div>
  );
};

/* ── Main modal ──────────────────────────────────────────────── */
const DealerDetailModal = ({ code, onClose }) => {
  const [dealer,  setDealer]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Loads full dealer detail by code; re-runs if code prop changes
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setDealer(await fetchDealerDetail(code)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [code]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="dn-detail-modal" onClick={(e) => e.stopPropagation()}>

        {loading && <div className="vp-loading"><span className="spinner vp-spinner" />Loading…</div>}
        {!loading && error && <p className="modal-error" style={{ margin: 20 }}>{error}</p>}

        {!loading && dealer && (
          <>
            {/* ── Modal header ───────────────────────────── */}
            <div className="dn-detail-modal-hdr">
              <div className="dn-detail-modal-title-group">
                <span className="dn-detail-modal-icon"><BuildingIcon size={18} /></span>
                <div>
                  <h2 className="dn-detail-modal-name">{dealer.name}</h2>
                  <p className="dn-detail-modal-sub">
                    {[dealer.code, dealer.region, dealer.country].filter(Boolean).join(" \u2022 ")}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={onClose}>✕</button>
            </div>

            {/* ── KPI mini cards ─────────────────────────── */}
            <div className="dn-detail-kpi-row">
              {[
                { label: "RELATED DEALERS",  value: dealer.related_dealers?.length ?? 0 },
                { label: "ASSIGNED REPS",    value: dealer.assigned_reps?.length   ?? 0 },
                { label: "CONNECTED ACCTS",  value: dealer.connected_accounts?.length ?? 0 },
                { label: "ACCOUNT VALUE",    value: fmtRevenueTable(dealer.annual_revenue) },
              ].map(({ label, value }) => (
                <div key={label} className="dn-detail-kpi">
                  <span className="dn-detail-kpi-label">{label}</span>
                  <span className="dn-detail-kpi-value">{value}</span>
                </div>
              ))}
            </div>

            {/* ── Core field grid ────────────────────────── */}
            <div className="dn-detail-field-grid">
              {[
                ["Type",          dealer.type],
                ["Tier",          dealer.tier ? dealer.tier.charAt(0).toUpperCase() + dealer.tier.slice(1) : "—"],
                ["Status",        dealer.status],
                ["Email",         dealer.email],
                ["Phone",         dealer.phone],
                ["City",          dealer.city],
                ["Data Owner",    dealer.data_owner],
                ["Annual Revenue",fmtRevenueTable(dealer.annual_revenue)],
                ["Contacts",      dealer.contacts ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="dn-detail-field">
                  <span className="dn-detail-field-label">{label}</span>
                  <span className="dn-detail-field-value">{value || "—"}</span>
                </div>
              ))}
            </div>

            {/* ── Related Dealers ────────────────────────── */}
            <Section
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>}
              title="Related Dealers"
              count={dealer.related_dealers?.length ?? 0}
            >
              {dealer.related_dealers?.length
                ? dealer.related_dealers.map((d, i) => <RelatedDealerRow key={i} d={d} />)
                : <p className="dn-empty-text">No related dealers.</p>}
            </Section>

            {/* ── Assigned Reps ──────────────────────────── */}
            <Section
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
              title="Assigned Reps"
              count={dealer.assigned_reps?.length ?? 0}
              badge={dealer.assigned_reps?.length ? "Sample" : null}
            >
              {dealer.assigned_reps?.length
                ? dealer.assigned_reps.map((r, i) => <RepRow key={i} r={r} />)
                : <p className="dn-empty-text">No reps assigned.</p>}
            </Section>

            {/* ── Connected Accounts ─────────────────────── */}
            <Section
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              title="Connected Accounts"
              count={dealer.connected_accounts?.length ?? 0}
              defaultOpen={false}
            >
              <p className="dn-empty-text">No accounts linked to this dealer</p>
            </Section>

            {/* ── Access & Stewardship ───────────────────── */}
            <AccessStewardship dealer={dealer} onRequestSent={load} />
          </>
        )}
      </div>
    </div>
  );
};

export default DealerDetailModal;
