const svc    = require("../services/rbacService");
const audit  = require("../services/auditService");
const { ACTIONS } = audit;

/**
 * Propagates HTTP status codes from service errors; defaults to 500.
 * @param {import('express').Response} res - Express response object
 * @param {Error & { status?: number }} e - The caught error, optionally carrying an HTTP status code
 * @returns {void}
 */
const handleErr = (res, e) =>
  res.status(e.status || 500).json({ error: e.message || "Server error" });

/**
 * Returns a filtered and paginated list of users.
 * Usage: Called by Express router on GET /api/rbac/users
 * @param {import('express').Request} req - req.query: filter/pagination params passed directly to the service
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: user list on success; { error } on failure
 */
async function listUsers(req, res) {
  try { return res.json(await svc.getUsers(req.query)); }
  catch (e) { return handleErr(res, e); }
}

/**
 * Returns a single user by ID.
 * Usage: Called by Express router on GET /api/rbac/users/:id
 * @param {import('express').Request} req - req.params.id: user ID
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: user object on success; 404 if not found; { error } on failure
 */
async function getUser(req, res) {
  try {
    const user = await svc.getUserById(parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json(user);
  } catch (e) { return handleErr(res, e); }
}

/**
 * Creates a user account and emits an audit event recording the initial attributes.
 * Usage: Called by Express router on POST /api/rbac/users
 * @param {import('express').Request} req - req.body: user payload { full_name, email, role, customer_type, ... }; req.user: performing user
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends 201 JSON: created user on success; { error } on failure
 */
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

/**
 * Updates user fields and emits a diff-based audit event recording only changed fields.
 * Usage: Called by Express router on PATCH /api/rbac/users/:id
 * @param {import('express').Request} req - req.params.id: user ID; req.body: fields to update; req.user: performing user
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: updated user on success; { error } on failure
 */
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

/**
 * Flips a user's active/inactive state and logs the appropriate audit event.
 * Usage: Called by Express router on PATCH /api/rbac/users/:id/toggle-status
 * @param {import('express').Request} req - req.params.id: user ID; req.user: performing user
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: updated user on success; { error } on failure
 */
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

/**
 * Replaces the user's full role set and logs the before/after role names for the audit trail.
 * Usage: Called by Express router on PUT /api/rbac/users/:id/roles
 * @param {import('express').Request} req - req.params.id: user ID; req.body.role_ids: array of role IDs; req.user: performing user
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: updated user with roles on success; { error } on failure
 */
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
/**
 * Returns a filtered list of roles.
 * Usage: Called by Express router on GET /api/rbac/roles
 * @param {import('express').Request} req - req.query: filter params passed directly to the service
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: role list on success; { error } on failure
 */
async function listRoles(req, res) {
  try { return res.json(await svc.getRoles(req.query)); }
  catch (e) { return handleErr(res, e); }
}

/**
 * Returns a single role with its permissions, menus, and pages.
 * Usage: Called by Express router on GET /api/rbac/roles/:id
 * @param {import('express').Request} req - req.params.id: role ID
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: role object on success; { error } on failure
 */
async function getRole(req, res) {
  try { return res.json(await svc.getRoleById(parseInt(req.params.id))); }
  catch (e) { return handleErr(res, e); }
}

/**
 * Creates a new role and emits an audit event.
 * Usage: Called by Express router on POST /api/rbac/roles
 * @param {import('express').Request} req - req.body: { name, description, ... }; req.user: performing user
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends 201 JSON: created role on success; { error } on failure
 */
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

/**
 * Updates role metadata and emits a diff-based audit event recording only changed fields.
 * Usage: Called by Express router on PATCH /api/rbac/roles/:id
 * @param {import('express').Request} req - req.params.id: role ID; req.body: fields to update; req.user: performing user
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: updated role on success; { error } on failure
 */
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

/**
 * Deletes a role and emits an audit event with the deleted role's metadata.
 * Usage: Called by Express router on DELETE /api/rbac/roles/:id
 * @param {import('express').Request} req - req.params.id: role ID; req.user: performing user
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: deletion result on success; { error } on failure
 */
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

/**
 * Duplicates a role with all its permissions; audit records the source role for traceability.
 * Usage: Called by Express router on POST /api/rbac/roles/:id/clone
 * @param {import('express').Request} req - req.params.id: source role ID; req.body.name: name for the new role; req.user: performing user
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends 201 JSON: cloned role on success; { error } on failure
 */
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

/**
 * Replaces the full permission set for a role; logs old permissions as module:action strings in the audit trail.
 * Usage: Called by Express router on PUT /api/rbac/roles/:id/permissions
 * @param {import('express').Request} req - req.params.id: role ID; req.body.permission_ids: array of permission IDs; req.user: performing user
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: updated role on success; { error } on failure
 */
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

/**
 * Replaces which navigation menus a role can see; drives sidebar visibility in the UI.
 * Usage: Called by Express router on PUT /api/rbac/roles/:id/menus
 * @param {import('express').Request} req - req.params.id: role ID; req.body.menu_ids: array of menu IDs; req.user: performing user
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: updated role on success; { error } on failure
 */
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

/**
 * Replaces which pages a role can access; drives route-level guards in the frontend.
 * Usage: Called by Express router on PUT /api/rbac/roles/:id/pages
 * @param {import('express').Request} req - req.params.id: role ID; req.body.page_ids: array of page IDs; req.user: performing user
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: updated role on success; { error } on failure
 */
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
/**
 * Returns all permission modules.
 * Usage: Called by Express router on GET /api/rbac/modules
 * @param {import('express').Request} req - No parameters used
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: module list on success; { error } on failure
 */
async function listModules(req, res) {
  try { return res.json(await svc.getModules()); }
  catch (e) { return handleErr(res, e); }
}

/**
 * Creates a new permission module.
 * Usage: Called by Express router on POST /api/rbac/modules
 * @param {import('express').Request} req - req.body: module payload
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends 201 JSON: created module on success; { error } on failure
 */
async function createModule(req, res) {
  try { return res.status(201).json(await svc.createModule(req.body)); }
  catch (e) { return handleErr(res, e); }
}

/**
 * Updates a permission module's metadata.
 * Usage: Called by Express router on PATCH /api/rbac/modules/:id
 * @param {import('express').Request} req - req.params.id: module ID; req.body: fields to update
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: updated module on success; { error } on failure
 */
async function updateModule(req, res) {
  try { return res.json(await svc.updateModule(parseInt(req.params.id), req.body)); }
  catch (e) { return handleErr(res, e); }
}

/**
 * Toggles a permission module's active/inactive state.
 * Usage: Called by Express router on PATCH /api/rbac/modules/:id/toggle
 * @param {import('express').Request} req - req.params.id: module ID
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: updated module on success; { error } on failure
 */
async function toggleModuleStatus(req, res) {
  try { return res.json(await svc.toggleModuleStatus(parseInt(req.params.id))); }
  catch (e) { return handleErr(res, e); }
}

// ─── Permissions ──────────────────────────────────────────────
/**
 * Returns all available permissions across all modules.
 * Usage: Called by Express router on GET /api/rbac/permissions
 * @param {import('express').Request} req - No parameters used
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: permission list on success; { error } on failure
 */
async function listPermissions(req, res) {
  try { return res.json(await svc.getPermissions()); }
  catch (e) { return handleErr(res, e); }
}

// ─── Menus ────────────────────────────────────────────────────
/**
 * Returns all navigation menu items.
 * Usage: Called by Express router on GET /api/rbac/menus
 * @param {import('express').Request} req - No parameters used
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: menu list on success; { error } on failure
 */
async function listMenus(req, res) {
  try { return res.json(await svc.getMenus()); }
  catch (e) { return handleErr(res, e); }
}

/**
 * Creates a new navigation menu item.
 * Usage: Called by Express router on POST /api/rbac/menus
 * @param {import('express').Request} req - req.body: menu payload
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends 201 JSON: created menu on success; { error } on failure
 */
async function createMenu(req, res) {
  try { return res.status(201).json(await svc.createMenu(req.body)); }
  catch (e) { return handleErr(res, e); }
}

/**
 * Updates a navigation menu item's metadata.
 * Usage: Called by Express router on PATCH /api/rbac/menus/:id
 * @param {import('express').Request} req - req.params.id: menu ID; req.body: fields to update
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: updated menu on success; { error } on failure
 */
async function updateMenu(req, res) {
  try { return res.json(await svc.updateMenu(parseInt(req.params.id), req.body)); }
  catch (e) { return handleErr(res, e); }
}

// ─── Pages ────────────────────────────────────────────────────
/**
 * Returns all registered frontend pages available for role-based access control.
 * Usage: Called by Express router on GET /api/rbac/pages
 * @param {import('express').Request} req - No parameters used
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: page list on success; { error } on failure
 */
async function listPages(req, res) {
  try { return res.json(await svc.getPages()); }
  catch (e) { return handleErr(res, e); }
}

// ─── Current User Access ──────────────────────────────────────
/**
 * Returns the calling user's own roles, permissions, menus, and pages in one payload.
 * Usage: Called by Express router on GET /api/rbac/me/access
 * @param {import('express').Request} req - req.user.id: authenticated user's ID
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: access summary on success; { error } on failure
 */
async function myAccess(req, res) {
  try { return res.json(await svc.getUserAccess(req.user.id)); }
  catch (e) { return handleErr(res, e); }
}

/**
 * Returns a specific user's full access summary (roles, permissions, menus, pages); used by admins auditing permissions.
 * Usage: Called by Express router on GET /api/rbac/users/:id/access
 * @param {import('express').Request} req - req.params.id: target user ID
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} Sends JSON: access summary on success; { error } on failure
 */
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
