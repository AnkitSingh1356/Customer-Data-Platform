/**
 * Thin wrapper around fetch that automatically injects the stored JWT as a Bearer
 * Authorization header.
 * Usage: use instead of raw fetch for all authenticated CDP API calls so token
 * management stays centralised; unauthenticated requests (no token in storage)
 * pass through without an Authorization header.
 * @param {string} url - The full URL to fetch.
 * @param {RequestInit} [options={}] - Standard fetch options; caller-supplied headers
 *   take precedence over the auth header.
 * @returns {Promise<Response>} The raw fetch Response — callers must handle .json() and .ok checks.
 */
export default function apiFetch(url, options = {}) {
  const token = localStorage.getItem("cdp_token");
  // Only attach the header when a token exists; unauthenticated requests pass through
  const auth  = token ? { Authorization: `Bearer ${token}` } : {};

  return fetch(url, {
    ...options,
    // Caller-supplied headers take precedence; auth header is appended last
    headers: { ...(options.headers || {}), ...auth },
  });
}
