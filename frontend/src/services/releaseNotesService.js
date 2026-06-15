const PIMCORE_BASE = import.meta.env.VITE_PIMCORE_BASE_URL || 'http://localhost';

function buildQs(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
}

async function request(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const releaseNotesApi = {
  getAll: (params = {}) =>
    request(`${PIMCORE_BASE}/api/release-notes${buildQs(params)}`),

  getLatest: () =>
    request(`${PIMCORE_BASE}/api/release-notes/latest`),

  getByVersion: (version) =>
    request(`${PIMCORE_BASE}/api/release-notes/${encodeURIComponent(version)}`),
};
