// Release notes are served from Pimcore CMS, not the main CDP API
const PIMCORE_BASE = import.meta.env.VITE_PIMCORE_BASE_URL || 'http://localhost';

// Omits blank/null params so the CMS receives a clean query string
function buildQs(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
}

// Unauthenticated fetch helper — release notes are public content from Pimcore;
// falls back to an empty object if the error body is not valid JSON
async function request(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const releaseNotesApi = {
  // GET /api/release-notes — filterable list of all release note entries
  getAll: (params = {}) =>
    request(`${PIMCORE_BASE}/api/release-notes${buildQs(params)}`),

  // GET /api/release-notes/latest — returns only the most recent release entry
  getLatest: () =>
    request(`${PIMCORE_BASE}/api/release-notes/latest`),

  // GET /api/release-notes/:version — fetches a single release note by semver
  getByVersion: (version) =>
    request(`${PIMCORE_BASE}/api/release-notes/${encodeURIComponent(version)}`),
};
