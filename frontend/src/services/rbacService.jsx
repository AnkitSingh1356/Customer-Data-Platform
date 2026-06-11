const BASE       = `${import.meta.env.VITE_API_BASE_URL}/api/rbac`;
const AUDIT_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/audit`;

async function request(endpoint, options = {}, authHeaders = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...authHeaders },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function qs(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  return new URLSearchParams(clean).toString();
}

export const rbacApi = {
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

async function auditRequest(endpoint, options = {}, authHeaders = {}) {
  const res = await fetch(`${AUDIT_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...authHeaders },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const auditApi = {
  getLogs: (params, h) => auditRequest(`/?${qs(params)}`, {}, h),
};
