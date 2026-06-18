// Release notes are served from Pimcore CMS, not the main CDP API
const PIMCORE_BASE = import.meta.env.VITE_PIMCORE_BASE_URL || 'http://localhost';

/**
 * Builds a query string from a params object, omitting blank, null, and undefined values.
 * Usage: Internal helper to keep Pimcore CMS request URLs clean.
 * @param {Object} [params={}] - Key/value pairs to serialize
 * @returns {string} URL-encoded query string with leading "?" or empty string if no params
 */
function buildQs(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
}

/**
 * Unauthenticated fetch helper for public Pimcore CMS content.
 * Usage: Internal helper used by all releaseNotesApi methods; not for authenticated endpoints.
 * @param {string} url - Full URL to fetch
 * @returns {Promise<any>} Parsed JSON response body
 */
async function request(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Namespace object containing all release notes API methods served from Pimcore CMS.
 * Usage: Import and call directly; no authentication required as notes are public content.
 */
export const releaseNotesApi = {
  /**
   * Fetches a filterable list of all release note entries from Pimcore.
   * Usage: Call on page load with optional filter params (search, tag, sort, page).
   * @param {Object} [params={}] - Optional query params such as search, tag, sort, page, limit
   * @returns {Promise<{data: Object[], pagination: Object}>} Release notes array and pagination metadata
   */
  getAll: (params = {}) =>
    request(`${PIMCORE_BASE}/api/release-notes${buildQs(params)}`),

  /**
   * Fetches only the most recent release note entry from Pimcore.
   * Usage: Call to display the latest version badge or summary notification.
   * @returns {Promise<Object>} The most recent release note object
   */
  getLatest: () =>
    request(`${PIMCORE_BASE}/api/release-notes/latest`),

  /**
   * Fetches a single release note entry by its semantic version string.
   * Usage: Call when navigating to a specific version's detail view.
   * @param {string} version - Semver string (e.g. "1.4.2"); will be URI-encoded
   * @returns {Promise<Object>} The release note object for the specified version
   */
  getByVersion: (version) =>
    request(`${PIMCORE_BASE}/api/release-notes/${encodeURIComponent(version)}`),
};
