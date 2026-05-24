//cdp-bulk-upload\sidebar-app\src\components\DealerNetwork\useDealers.jsx
import { useState, useEffect, useCallback } from "react";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/dealers`;

export function useDealers(search = "") {
  const [dealers,  setDealers]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const fetch_ = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const [dRes, sRes] = await Promise.all([
        fetch(`${BASE}${params}`),
        fetch(`${BASE}/stats`),
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

export async function fetchDealerDetail(code) {
  const res  = await fetch(`${BASE}/${code}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load dealer.");
  return data;
}

export async function submitAccessRequest(code, target_uuid) {
  const res  = await fetch(`${BASE}/${code}/access`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ target_uuid }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}
