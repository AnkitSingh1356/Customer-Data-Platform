const svc    = require("../services/rbacService");
const audit  = require("../services/auditService");
const { ACTIONS } = audit;

// Propagates HTTP status codes from service errors; defaults to 500
const handleErr = (res, e) =>
  res.status(e.status || 500).json({ error: e.message || "Server error" });

async function listUsers(req, res) {
  try { return res.json(await svc.getUsers(req.query)); }
  catch (e) { return handleErr(res, e); }
}

async function getUser(req, res) {
  try {
    const user = await svc.getUserById(parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json(user);
  } catch (e) { return handleErr(res, e); }
}

// Creates a user account and emits an audit event recording the initial attributes
async function createUser(req, res) {
  try {
    const result = await svc.createUser(req.body);
    audit.log({
      action:      ACTIONS.USER_CREATED,
      performedBy: req.user,
      targetUser:  result,
      entityType:  "user",
      newValue:    { full_name: result.full_name, email: result.email, role: result.role, customer_type: result.customer_type },
    });
    return res.status(201).json(result);
  } catch (e) { return handleErr(res, e); }
}

// Updates user fields; computes a field-level diff so the audit log only records changes
async function updateUser(req, res) {
  try {
    const id  = parseInt(req.params.id);
    // Snapshot before update to build a meaningful old-value audit trail
    const old = await svc.getUserById(id);
    const result = await svc.updateUser(id, req.body);
    const changed = {};
    const oldSnap = {};
    for (const key of ["full_name", "email", "role", "customer_type", "department", "phone"]) {
      if (old[key] !== result[key]) {
        oldSnap[key] = old[key];
        changed[key] = result[key];
      }
    }
    // Skip audit write if nothing actually changed (e.g., no-op PATCH)
    if (Object.keys(changed).length) {
      audit.log({
        action:      ACTIONS.USER_UPDATED,
        performedBy: req.user,
        targetUser:  result,
        entityType:  "user",
        oldValue:    oldSnap,
        newValue:    changed,
      });
    }
    return res.json(result);
  } catch (e) { return handleErr(res, e); }
}

// Flips a user's active/inactive state; audit action derived from the new state
async function toggleUserStatus(req, res) {
  try {
    const result = await svc.toggleUserStatus(parseInt(req.params.id));
    audit.log({
      action:      result.is_active ? ACTIONS.USER_ACTIVATED : ACTIONS.USER_DEACTIVATED,
      performedBy: req.user,
      targetUser:  result,
      entityType:  "user",
      newValue:    { is_active: result.is_active },
    });
    return res.json(result);
  } catch (e) { return handleErr(res, e); }
}

// Replaces the user's role set; logs the before/after role names for access audit trail
async function assignUserRoles(req, res) {
  try {
    const id  = parseInt(req.params.id);
    const old = await svc.getUserById(id);
    const result = await svc.assignUserRoles(id, req.body.role_ids);
    audit.log({
      action:      ACTIONS.USER_ROLES_UPDATED,
      performedBy: req.user,
      targetUser:  result,
      entityType:  "user_roles",
      oldValue:    { roles: (old.roles || []).map((r) => r.name) },
      newValue:    { roles: (result.roles || []).map((r) => r.name) },
    });
    return res.json(result);
  } catch (e) { return handleErr(res, e); }
}

// ─── Roles ────────────────────────────────────────────────────
async function listRoles(req, res) {
  try { return res.json(await svc.getRoles(req.query)); }
  catch (e) { return handleErr(res, e); }
}

async function getRole(req, res) {
  try { return res.json(await svc.getRoleById(parseInt(req.params.id))); }
  catch (e) { return handleErr(res, e); }
}

async function createRole(req, res) {
  try {
    const result = await svc.createRole(req.body);
    audit.log({
      action:      ACTIONS.ROLE_CREATED,
      performedBy: req.user,
      targetRole:  result,
      entityType:  "role",
      newValue:    { name: result.name, description: result.description },
    });
    return res.status(201).json(result);
  } catch (e) { return handleErr(res, e); }
}

// Updates role metadata; same diff-then-audit pattern as updateUser
async function updateRole(req, res) {
  try {
    const id  = parseInt(req.params.id);
    const old = await svc.getRoleById(id);
    const result = await svc.updateRole(id, req.body);
    const changed = {};
    const oldSnap = {};
    for (const key of ["name", "description", "is_active"]) {
      if (old[key] !== result[key]) { oldSnap[key] = old[key]; changed[key] = result[key]; }
    }
    if (Object.keys(changed).length) {
      audit.log({
        action:      ACTIONS.ROLE_UPDATED,
        performedBy: req.user,
        targetRole:  result,
        entityType:  "role",
        oldValue:    oldSnap,
        newValue:    changed,
      });
    }
    return res.json(result);
  } catch (e) { return handleErr(res, e); }
}

async function deleteRole(req, res) {
  try {
    const id   = parseInt(req.params.id);
    const role = await svc.getRoleById(id);
    const result = await svc.deleteRole(id);
    audit.log({
      action:      ACTIONS.ROLE_DELETED,
      performedBy: req.user,
      targetRole:  role,
      entityType:  "role",
      oldValue:    { name: role.name, description: role.description },
    });
    return res.json(result);
  } catch (e) { return handleErr(res, e); }
}

// Duplicates a role with all its permissions; audit records source role for traceability
async function cloneRole(req, res) {
  try {
    const src    = await svc.getRoleById(parseInt(req.params.id));
    const result = await svc.cloneRole(parseInt(req.params.id), req.body.name);
    audit.log({
      action:      ACTIONS.ROLE_CLONED,
      performedBy: req.user,
      targetRole:  result,
      entityType:  "role",
      metadata:    { cloned_from: src.name, new_name: result.name },
    });
    return res.status(201).json(result);
  } catch (e) { return handleErr(res, e); }
}

// Replaces the full permission set for a role; old permissions logged as module:action strings
async function setRolePermissions(req, res) {
  try {
    const id  = parseInt(req.params.id);
    const old = await svc.getRoleById(id);
    const result = await svc.setRolePermissions(id, req.body.permission_ids);
    audit.log({
      action:      ACTIONS.PERMISSIONS_UPDATED,
      performedBy: req.user,
      targetRole:  old,
      entityType:  "permissions",
      oldValue:    { permissions: old.permissions.map((p) => `${p.module_key}:${p.action}`) },
      newValue:    { permission_ids: req.body.permission_ids },
    });
    return res.json(result);
  } catch (e) { return handleErr(res, e); }
}

// Replaces which navigation menus a role can see; drives sidebar visibility in the UI
async function setRoleMenus(req, res) {
  try {
    const id  = parseInt(req.params.id);
    const old = await svc.getRoleById(id);
    const result = await svc.setRoleMenus(id, req.body.menu_ids);
    audit.log({
      action:      ACTIONS.MENU_ACCESS_UPDATED,
      performedBy: req.user,
      targetRole:  old,
      entityType:  "menus",
      oldValue:    { menus: old.menus.map((m) => m.key) },
      newValue:    { menus: req.body.menu_ids },
    });
    return res.json(result);
  } catch (e) { return handleErr(res, e); }
}

// Replaces which pages a role can access; drives route-level guards in the frontend
async function setRolePages(req, res) {
  try {
    const id  = parseInt(req.params.id);
    const old = await svc.getRoleById(id);
    const result = await svc.setRolePages(id, req.body.page_ids);
    audit.log({
      action:      ACTIONS.PAGE_ACCESS_UPDATED,
      performedBy: req.user,
      targetRole:  old,
      entityType:  "pages",
      oldValue:    { pages: old.pages.map((p) => p.key) },
      newValue:    { pages: req.body.page_ids },
    });
    return res.json(result);
  } catch (e) { return handleErr(res, e); }
}

// ─── Modules ──────────────────────────────────────────────────
async function listModules(req, res) {
  try { return res.json(await svc.getModules()); }
  catch (e) { return handleErr(res, e); }
}

async function createModule(req, res) {
  try { return res.status(201).json(await svc.createModule(req.body)); }
  catch (e) { return handleErr(res, e); }
}

async function updateModule(req, res) {
  try { return res.json(await svc.updateModule(parseInt(req.params.id), req.body)); }
  catch (e) { return handleErr(res, e); }
}

async function toggleModuleStatus(req, res) {
  try { return res.json(await svc.toggleModuleStatus(parseInt(req.params.id))); }
  catch (e) { return handleErr(res, e); }
}

// ─── Permissions ──────────────────────────────────────────────
async function listPermissions(req, res) {
  try { return res.json(await svc.getPermissions()); }
  catch (e) { return handleErr(res, e); }
}

// ─── Menus ────────────────────────────────────────────────────
async function listMenus(req, res) {
  try { return res.json(await svc.getMenus()); }
  catch (e) { return handleErr(res, e); }
}

async function createMenu(req, res) {
  try { return res.status(201).json(await svc.createMenu(req.body)); }
  catch (e) { return handleErr(res, e); }
}

async function updateMenu(req, res) {
  try { return res.json(await svc.updateMenu(parseInt(req.params.id), req.body)); }
  catch (e) { return handleErr(res, e); }
}

// ─── Pages ────────────────────────────────────────────────────
async function listPages(req, res) {
  try { return res.json(await svc.getPages()); }
  catch (e) { return handleErr(res, e); }
}

// ─── Current User Access ──────────────────────────────────────
// Returns the calling user's own roles, permissions, menus, and pages in one payload
async function myAccess(req, res) {
  try { return res.json(await svc.getUserAccess(req.user.id)); }
  catch (e) { return handleErr(res, e); }
}

// Returns a specific user's access summary; used by admins auditing a user's permissions
async function getUserAccessSummary(req, res) {
  try { return res.json(await svc.getUserAccessSummary(parseInt(req.params.id))); }
  catch (e) { return handleErr(res, e); }
}

module.exports = {
  listUsers, getUser, createUser, updateUser, toggleUserStatus, assignUserRoles,
  listRoles, getRole, createRole, updateRole, deleteRole, cloneRole,
  setRolePermissions, setRoleMenus, setRolePages,
  listModules, createModule, updateModule, toggleModuleStatus,
  listPermissions,
  listMenus, createMenu, updateMenu,
  listPages,
  myAccess, getUserAccessSummary,
};
