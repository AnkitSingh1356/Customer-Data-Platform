const BASE       = `${import.meta.env.VITE_API_BASE_URL}/api/rbac`;
const AUDIT_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/audit`;

/**
 * Sends a JSON fetch request to the RBAC API base URL and throws on non-ok responses.
 * Usage: Internal helper used by all rbacApi methods.
 * @param {string} endpoint - Path appended to BASE (e.g. "/users")
 * @param {RequestInit} [options={}] - Standard fetch options (method, body, etc.)
 * @param {Object} [authHeaders={}] - Auth header object from authHeader() in AuthContext
 * @returns {Promise<any>} Parsed JSON response body
 */
async function request(endpoint, options = {}, authHeaders = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...authHeaders },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

/**
 * Builds a query string from a params object, omitting undefined/null/empty-string values.
 * Usage: Internal helper to keep API URLs clean when optional filters are not applied.
 * @param {Object} [params={}] - Key/value pairs to serialize
 * @returns {string} URL-encoded query string (without leading "?")
 */
function qs(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  return new URLSearchParams(clean).toString();
}

/**
 * Namespace object containing all RBAC API methods for users, roles, modules, menus, and pages.
 * Usage: Import and call methods directly, passing authHeader() from AuthContext as the last argument.
 * All methods return the parsed JSON response from the RBAC API.
 */
export const rbacApi = {
  // GET /rbac/my-access — returns the current user's permissions, menus, and pages
  getMyAccess: (h) => request("/my-access", {}, h),

  getUsers:         (params, h) => request(`/users?${qs(params)}`, {}, h),
  getUser:          (id, h)     => request(`/users/${id}`, {}, h),
  createUser:       (body, h)   => request("/users", { method: "POST", body: JSON.stringify(body) }, h),
  updateUser:       (id, body, h) => request(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) }, h),
  toggleUserStatus: (id, h)     => request(`/users/${id}/status`, { method: "PUT" }, h),
  assignUserRoles:  (id, role_ids, h) => request(`/users/${id}/roles`, { method: "PUT", body: JSON.stringify({ role_ids }) }, h),

  getRoles:            (params, h) => request(`/roles?${qs(params)}`, {}, h),
  getRole:             (id, h)     => request(`/roles/${id}`, {}, h),
  createRole:          (body, h)   => request("/roles", { method: "POST", body: JSON.stringify(body) }, h),
  updateRole:          (id, body, h) => request(`/roles/${id}`, { method: "PUT", body: JSON.stringify(body) }, h),
  deleteRole:          (id, h)     => request(`/roles/${id}`, { method: "DELETE" }, h),
  cloneRole:           (id, name, h) => request(`/roles/${id}/clone`, { method: "POST", body: JSON.stringify({ name }) }, h),
  setRolePermissions:  (id, permission_ids, h) => request(`/roles/${id}/permissions`, { method: "PUT", body: JSON.stringify({ permission_ids }) }, h),
  setRoleMenus:        (id, menu_ids, h) => request(`/roles/${id}/menus`, { method: "PUT", body: JSON.stringify({ menu_ids }) }, h),
  setRolePages:        (id, page_ids, h) => request(`/roles/${id}/pages`, { method: "PUT", body: JSON.stringify({ page_ids }) }, h),

  getModules:         (h) => request("/modules", {}, h),
  createModule:       (body, h) => request("/modules", { method: "POST", body: JSON.stringify(body) }, h),
  updateModule:       (id, body, h) => request(`/modules/${id}`, { method: "PUT", body: JSON.stringify(body) }, h),
  toggleModuleStatus: (id, h) => request(`/modules/${id}/status`, { method: "PUT" }, h),

  getPermissions: (h) => request("/permissions", {}, h),

  getMenus:    (h)         => request("/menus", {}, h),
  createMenu:  (body, h)   => request("/menus", { method: "POST", body: JSON.stringify(body) }, h),
  updateMenu:  (id, body, h) => request(`/menus/${id}`, { method: "PUT", body: JSON.stringify(body) }, h),

  getPages: (h) => request("/pages", {}, h),

  getUserAccessSummary: (id, h) => request(`/users/${id}/summary`, {}, h),
};

/**
 * Sends a JSON fetch request to the audit API base URL and throws on non-ok responses.
 * Usage: Internal helper used by auditApi methods; isolated from rbac base URL.
 * @param {string} endpoint - Path appended to AUDIT_BASE
 * @param {RequestInit} [options={}] - Standard fetch options
 * @param {Object} [authHeaders={}] - Auth header object from authHeader()
 * @returns {Promise<any>} Parsed JSON response body
 */
async function auditRequest(endpoint, options = {}, authHeaders = {}) {
  const res = await fetch(`${AUDIT_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...authHeaders },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

/**
 * Namespace object containing audit log API methods.
 * Usage: Import and call methods directly, passing authHeader() from AuthContext as the last argument.
 */
export const auditApi = {
  // GET /audit/?<params> — returns paginated system audit log entries
  getLogs: (params, h) => auditRequest(`/?${qs(params)}`, {}, h),
};
