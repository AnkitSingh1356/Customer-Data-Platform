import { useState, useEffect, useCallback } from "react";
import apiFetch from "../../services/apiFetch";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/segments`;

// Manages segment list, aggregate stats, and full CRUD for the Segments page.
// Accepts optional search and status filters; refetches when either changes.
export function useSegments({ search = "", status = "" } = {}) {
  const [segments,  setSegments]  = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  // Fetches filtered segment list and summary stats in parallel
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status) params.append("status", status);

      const [segRes, statRes] = await Promise.all([
        apiFetch(`${BASE}?${params}`),
        apiFetch(`${BASE}/stats`),
      ]);
      if (!segRes.ok || !statRes.ok) throw new Error("API unavailable");
      const [segs, st] = await Promise.all([segRes.json(), statRes.json()]);
      setSegments(segs);
      setStats(st);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // POSTs a new segment; refreshes list on success
  const createSegment = async (payload) => {
    const res  = await apiFetch(BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Create failed");
    await fetchAll();
    return data;
  };

  // PUTs an updated segment by id; refreshes list on success
  const updateSegment = async (id, payload) => {
    const res  = await apiFetch(`${BASE}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    await fetchAll();
    return data;
  };

  // DELETEs a segment by id; refreshes list on success
  const deleteSegment = async (id) => {
    const res = await apiFetch(`${BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Delete failed"); }
    await fetchAll();
  };

  return { segments, stats, loading, error, refetch: fetchAll, createSegment, updateSegment, deleteSegment };
}
