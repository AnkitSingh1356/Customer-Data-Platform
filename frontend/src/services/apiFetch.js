export default function apiFetch(url, options = {}) {
  const token = localStorage.getItem("cdp_token");
  const auth  = token ? { Authorization: `Bearer ${token}` } : {};

  return fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), ...auth },
  });
}
