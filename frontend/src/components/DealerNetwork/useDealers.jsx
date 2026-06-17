import { useState, useEffect, useCallback } from "react";
import apiFetch from "../../services/apiFetch";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/dealers`;

// Manages dealer list + aggregate stats; refetches whenever search changes
export function useDealers(search = "") {
  const [dealers,  setDealers]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // Fetches dealer list and network-wide stats in parallel
  const fetch_ = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const [dRes, sRes] = await Promise.all([
        apiFetch(`${BASE}${params}`),
        apiFetch(`${BASE}/stats`),
      ]);
      if (!dRes.ok || !sRes.ok) throw new Error("API unavailable");
      const [d, s] = await Promise.all([dRes.json(), sRes.json()]);
      setDealers(d);
      setStats(s);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { dealers, stats, loading, error, refetch: fetch_ };
}

// Fetches full dealer detail including related dealers, reps, and access requests
export async function fetchDealerDetail(code) {
  const res  = await apiFetch(`${BASE}/${code}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load dealer.");
  return data;
}

// POSTs a stewardship access request for the given dealer to a target user UUID
export async function submitAccessRequest(code, target_uuid) {
  const res  = await apiFetch(`${BASE}/${code}/access`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ target_uuid }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}
