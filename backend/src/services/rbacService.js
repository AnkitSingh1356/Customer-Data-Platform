const pool       = require("../config/db");
const bcrypt     = require("bcryptjs");
const { SALT_ROUNDS, DEFAULT_PAGE_LIMIT, DEFAULT_ROLES_LIMIT, STANDARD_PERMISSION_ACTIONS } = require("../config/constants");

/**
 * Creates a new Error with an attached HTTP status code for consistent error handling.
 * Usage: Thrown throughout rbacService to produce structured API errors
 * @param {string} msg - Human-readable error message
 * @param {number} [status=400] - HTTP status code to attach
 * @returns {Error} Error instance with a status property
 */
function err(msg, status = 400) {
  return Object.assign(new Error(msg), { status });
}


/**
 * Returns paginated users with their assigned RBAC roles aggregated as a JSON array.
 * Usage: Called by rbacController.getUsers
 * @param {Object} [opts={}] - Filter and pagination options
 * @param {number} [opts.page=1] - Page number (1-based)
 * @param {number} [opts.limit=DEFAULT_PAGE_LIMIT] - Records per page
 * @param {string} [opts.search=""] - Partial match on full_name or email
 * @param {string} [opts.customer_type=""] - Filter by customer_type (exact match)
 * @returns {Promise<{ users: Array<Object>, total: number, page: number, limit: number }>}
 */
async function getUsers({ page = 1, limit = DEFAULT_PAGE_LIMIT, search = "", customer_type = "" } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }
  if (customer_type) {
    params.push(customer_type);
    conditions.push(`u.customer_type = $${params.length}`);
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM users u ${where}`,
    params
  );

  params.push(Number(limit), offset);
  const res = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.role, u.customer_type,
            u.department, u.phone, u.is_active, u.last_login, u.avatar_url,
            TO_CHAR(u.created_at, 'Mon DD, YYYY') AS created_at,
            COALESCE(
              json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name))
              FILTER (WHERE r.id IS NOT NULL), '[]'
            ) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN rbac_roles r  ON r.id = ur.role_id
     ${where}
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    users: res.rows,
    total: parseInt(countRes.rows[0].count, 10),
    page: Number(page),
    limit: Number(limit),
  };
}

/**
 * Returns a single user with their RBAC roles aggregated as a JSON array, or null if not found.
 * Usage: Called internally and by rbacController.getUserById
 * @param {number} id - User primary key
 * @returns {Promise<Object|null>} User row with roles array, or null
 */
async function getUserById(id) {
  const res = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.role, u.customer_type,
            u.department, u.phone, u.is_active, u.last_login, u.avatar_url,
            TO_CHAR(u.created_at, 'Mon DD, YYYY') AS created_at,
            COALESCE(
              json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name))
              FILTER (WHERE r.id IS NOT NULL), '[]'
            ) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN rbac_roles r  ON r.id = ur.role_id
     WHERE u.id = $1
     GROUP BY u.id`,
    [id]
  );
  return res.rows[0] ?? null;
}

/**
 * Creates a new user account with a hashed password, defaulting to the 'viewer' role.
 * Usage: Called by rbacController.createUser
 * @param {Object} opts - New user fields
 * @param {string} opts.full_name - Required display name
 * @param {string} opts.email - Required unique email address
 * @param {string} opts.password - Required plaintext password (hashed before storage)
 * @param {string} [opts.role="viewer"] - RBAC role string
 * @param {string} [opts.customer_type="Employee"] - Customer type
 * @param {string} [opts.department] - Optional department
 * @param {string} [opts.phone] - Optional phone number
 * @returns {Promise<Object>} Newly created user row (without password_hash)
 */
async function createUser({ full_name, email, password, role, customer_type, department, phone }) {
  if (!full_name?.trim() || !email?.trim() || !password) {
    throw err("full_name, email, and password are required.");
  }
  const exists = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email.toLowerCase().trim()]
  );
  if (exists.rows.length) throw err("Email already exists.", 409);

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const res = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, customer_type, department, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, full_name, email, role, customer_type, department, phone, is_active,
                 TO_CHAR(created_at, 'Mon DD, YYYY') AS created_at`,
      [
        full_name.trim(),
        email.toLowerCase().trim(),
        password_hash,
        role          || "viewer",
        customer_type || "Employee",
        department    || null,
        phone         || null,
      ]
    );
    return res.rows[0];
  } catch (e) {
    if (e.code === "23505") throw err("Email already exists.", 409);
    throw e;
  }
}

/**
 * Applies a partial update to a user record using only the provided fields.
 * Usage: Called by rbacController.updateUser
 * @param {number} id - User primary key
 * @param {Object} opts - Fields to update (only defined properties are applied)
 * @param {string} [opts.full_name] - Display name
 * @param {string} [opts.email] - Unique email address
 * @param {string} [opts.role] - RBAC role string
 * @param {string} [opts.customer_type] - Customer type
 * @param {string} [opts.department] - Department
 * @param {string} [opts.phone] - Phone number
 * @returns {Promise<Object>} Updated user row (without password_hash)
 */
async function updateUser(id, { full_name, email, role, customer_type, department, phone }) {
  const fields = [];
  const params = [];

  if (full_name     !== undefined) { params.push(full_name.trim());               fields.push(`full_name = $${params.length}`); }
  if (email         !== undefined) { params.push(email.toLowerCase().trim());     fields.push(`email = $${params.length}`); }
  if (role          !== undefined) { params.push(role);                           fields.push(`role = $${params.length}`); }
  if (customer_type !== undefined) { params.push(customer_type);                  fields.push(`customer_type = $${params.length}`); }
  if (department    !== undefined) { params.push(department || null);             fields.push(`department = $${params.length}`); }
  if (phone         !== undefined) { params.push(phone || null);                  fields.push(`phone = $${params.length}`); }

  if (!fields.length) throw err("No fields to update.");

  params.push(id);
  try {
    const res = await pool.query(
      `UPDATE users SET ${fields.join(", ")}, updated_at = NOW()
       WHERE id = $${params.length}
       RETURNING id, full_name, email, role, customer_type, department, phone, is_active,
                 TO_CHAR(created_at, 'Mon DD, YYYY') AS created_at`,
      params
    );
    if (!res.rows.length) throw err("User not found.", 404);
    return res.rows[0];
  } catch (e) {
    if (e.code === "23505") throw err("Email already in use by another account.", 409);
    throw e;
  }
}

/**
 * Toggles the is_active flag on a user account (activate/deactivate).
 * Usage: Called by rbacController.toggleUserStatus
 * @param {number} id - User primary key
 * @returns {Promise<{ id: number, full_name: string, email: string, is_active: boolean }>}
 */
async function toggleUserStatus(id) {
  const res = await pool.query(
    `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
     WHERE id = $1
     RETURNING id, full_name, email, is_active`,
    [id]
  );
  if (!res.rows.length) throw err("User not found.", 404);
  return res.rows[0];
}

/**
 * Replaces a user's role assignments atomically: existing roles are cleared before the
 * new set is inserted to keep the user_roles table in sync.
 * Usage: Called by rbacController.assignUserRoles
 * @param {number} userId - User primary key
 * @param {Array<number>} [roleIds=[]] - Complete list of role IDs to assign
 * @returns {Promise<Object>} Updated user row with new roles array
 */
async function assignUserRoles(userId, roleIds = []) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Full replace: delete all current roles before inserting the new set
    await client.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);
    if (roleIds.length) {
      const vals = roleIds.map((_, i) => `($1, $${i + 2})`).join(", ");
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ${vals} ON CONFLICT DO NOTHING`,
        [userId, ...roleIds]
      );
    }
    await client.query("COMMIT");
    return getUserById(userId);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// ─── Role Management ────────────────────────────────────────────

/**
 * Returns paginated RBAC roles with a user_count for each role.
 * Usage: Called by rbacController.getRoles
 * @param {Object} [opts={}] - Filter and pagination options
 * @param {number} [opts.page=1] - Page number (1-based)
 * @param {number} [opts.limit=DEFAULT_ROLES_LIMIT] - Records per page
 * @param {string} [opts.search=""] - Partial match on role name or description
 * @returns {Promise<{ roles: Array<Object>, total: number, page: number, limit: number }>}
 */
async function getRoles({ page = 1, limit = DEFAULT_ROLES_LIMIT, search = "" } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  let where = "";

  if (search) {
    params.push(`%${search}%`);
    where = `WHERE r.name ILIKE $1 OR r.description ILIKE $1`;
  }

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM rbac_roles r ${where}`,
    params
  );

  params.push(Number(limit), offset);
  const res = await pool.query(
    `SELECT r.*,
            (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS user_count
     FROM rbac_roles r
     ${where}
     ORDER BY r.created_at ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    roles: res.rows,
    total: parseInt(countRes.rows[0].count, 10),
    page: Number(page),
    limit: Number(limit),
  };
}

/**
 * Returns a role with its full permission, menu, and page assignments resolved.
 * Permissions are joined through rbac_modules so callers receive module context.
 * Usage: Called by rbacController.getRoleById and internally by cloneRole
 * @param {number} id - Role primary key
 * @returns {Promise<Object>} Role row augmented with permissions, menus, and pages arrays
 */
async function getRoleById(id) {
  const res = await pool.query(
    `SELECT r.*,
            (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS user_count
     FROM rbac_roles r WHERE r.id = $1`,
    [id]
  );
  if (!res.rows.length) throw err("Role not found.", 404);
  const role = res.rows[0];

  // Fetch permissions, menus, and page grants in parallel to reduce latency
  const [perms, menus, pages] = await Promise.all([
    pool.query(
      `SELECT p.id, p.action, m.key AS module_key, m.label AS module_label
       FROM rbac_role_permissions rp
       JOIN rbac_permissions p ON p.id = rp.permission_id
       JOIN rbac_modules m ON m.id = p.module_id
       WHERE rp.role_id = $1 ORDER BY m.sort_order, p.action`,
      [id]
    ),
    pool.query(
      `SELECT mn.id, mn.key, mn.label, mn.icon, mn.sort_order
       FROM rbac_role_menus rm
       JOIN rbac_menus mn ON mn.id = rm.menu_id
       WHERE rm.role_id = $1 ORDER BY mn.sort_order`,
      [id]
    ),
    pool.query(
      `SELECT pg.id, pg.key, pg.label, pg.route, pg.module_key
       FROM rbac_role_pages rp
       JOIN rbac_pages pg ON pg.id = rp.page_id
       WHERE rp.role_id = $1 ORDER BY pg.label`,
      [id]
    ),
  ]);

  return { ...role, permissions: perms.rows, menus: menus.rows, pages: pages.rows };
}

/**
 * Creates a new RBAC role with an optional description.
 * Usage: Called by rbacController.createRole
 * @param {Object} opts - Role creation data
 * @param {string} opts.name - Required unique role name
 * @param {string} [opts.description] - Optional description
 * @returns {Promise<Object>} Newly created rbac_roles row
 */
async function createRole({ name, description }) {
  if (!name?.trim()) throw err("Role name is required.");
  const res = await pool.query(
    `INSERT INTO rbac_roles (name, description) VALUES ($1, $2) RETURNING *`,
    [name.trim(), description || null]
  );
  return res.rows[0];
}

/**
 * Applies a partial update to an RBAC role using only the provided fields.
 * Usage: Called by rbacController.updateRole
 * @param {number} id - Role primary key
 * @param {Object} opts - Fields to update
 * @param {string} [opts.name] - Role name
 * @param {string} [opts.description] - Role description
 * @param {boolean} [opts.is_active] - Active flag
 * @returns {Promise<Object>} Updated rbac_roles row
 */
async function updateRole(id, { name, description, is_active }) {
  const fields = [];
  const params = [];

  if (name        !== undefined) { params.push(name.trim()); fields.push(`name = $${params.length}`); }
  if (description !== undefined) { params.push(description); fields.push(`description = $${params.length}`); }
  if (is_active   !== undefined) { params.push(is_active);   fields.push(`is_active = $${params.length}`); }

  if (!fields.length) throw err("No fields to update.");

  params.push(id);
  const res = await pool.query(
    `UPDATE rbac_roles SET ${fields.join(", ")}, updated_at = NOW()
     WHERE id = $${params.length}
     RETURNING *`,
    params
  );
  if (!res.rows.length) throw err("Role not found.", 404);
  return res.rows[0];
}

/**
 * Deletes a role only if it is not assigned to any users. Uses FOR UPDATE to lock
 * the check and delete in one transaction, preventing a TOCTOU race.
 * Usage: Called by rbacController.deleteRole
 * @param {number} id - Role primary key
 * @returns {Promise<{ message: string }>} Success confirmation message
 */
async function deleteRole(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inUse = await client.query(
      "SELECT COUNT(*) FROM user_roles WHERE role_id = $1 FOR UPDATE",
      [id]
    );
    if (parseInt(inUse.rows[0].count) > 0) {
      throw err("Cannot delete role: it is currently assigned to users.", 409);
    }
    const res = await client.query("DELETE FROM rbac_roles WHERE id = $1 RETURNING id", [id]);
    if (!res.rows.length) throw err("Role not found.", 404);
    await client.query("COMMIT");
    return { message: "Role deleted successfully." };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Duplicates a role and copies all its permission, menu, and page grants atomically.
 * The clone is created with an optional custom name, defaulting to "<source name> (Copy)".
 * Usage: Called by rbacController.cloneRole
 * @param {number} id - Source role primary key
 * @param {string} [newName] - Optional name for the cloned role
 * @returns {Promise<Object>} The newly created role with all permissions, menus, and pages resolved
 */
async function cloneRole(id, newName) {
  const src = await getRoleById(id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const clonedRes = await client.query(
      `INSERT INTO rbac_roles (name, description) VALUES ($1, $2) RETURNING *`,
      [newName?.trim() || `${src.name} (Copy)`, src.description || null]
    );
    const cloned = clonedRes.rows[0];

    const bulkInsert = async (table, col1, col2, items) => {
      if (!items.length) return;
      const vals = items.map((_, i) => `($1, $${i + 2})`).join(", ");
      await client.query(
        `INSERT INTO ${table} (${col1}, ${col2}) VALUES ${vals} ON CONFLICT DO NOTHING`,
        [cloned.id, ...items.map((x) => x.id)]
      );
    };

    await bulkInsert("rbac_role_permissions", "role_id", "permission_id", src.permissions);
    await bulkInsert("rbac_role_menus",       "role_id", "menu_id",       src.menus);
    await bulkInsert("rbac_role_pages",       "role_id", "page_id",       src.pages);

    await client.query("COMMIT");
    return getRoleById(cloned.id);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Generic helper that replaces all rows in a role-relation join table (permissions,
 * menus, or pages) for a given role in a single transaction.
 * Usage: Called internally by setRolePermissions, setRoleMenus, and setRolePages
 * @param {number} roleId - Role primary key
 * @param {Array<number>} ids - Complete list of related entity IDs to assign
 * @param {string} table - Join table name (e.g. "rbac_role_permissions")
 * @param {string} col - Foreign key column name for the related entity (e.g. "permission_id")
 * @returns {Promise<void>}
 */
async function setRoleRelations(roleId, ids, table, col) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${table} WHERE role_id = $1`, [roleId]);
    if (ids?.length) {
      const vals = ids.map((_, i) => `($1, $${i + 2})`).join(", ");
      await client.query(
        `INSERT INTO ${table} (role_id, ${col}) VALUES ${vals} ON CONFLICT DO NOTHING`,
        [roleId, ...ids]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Replaces all permission assignments for a role and returns the updated role with full resolution.
 * Usage: Called by rbacController.setRolePermissions
 * @param {number} roleId - Role primary key
 * @param {Array<number>} permissionIds - Complete list of permission IDs to assign
 * @returns {Promise<Object>} Updated role with permissions, menus, and pages resolved
 */
async function setRolePermissions(roleId, permissionIds) {
  await setRoleRelations(roleId, permissionIds, "rbac_role_permissions", "permission_id");
  return getRoleById(roleId);
}

/**
 * Replaces all menu assignments for a role and returns the updated role with full resolution.
 * Usage: Called by rbacController.setRoleMenus
 * @param {number} roleId - Role primary key
 * @param {Array<number>} menuIds - Complete list of menu IDs to assign
 * @returns {Promise<Object>} Updated role with permissions, menus, and pages resolved
 */
async function setRoleMenus(roleId, menuIds) {
  await setRoleRelations(roleId, menuIds, "rbac_role_menus", "menu_id");
  return getRoleById(roleId);
}

/**
 * Replaces all page assignments for a role and returns the updated role with full resolution.
 * Usage: Called by rbacController.setRolePages
 * @param {number} roleId - Role primary key
 * @param {Array<number>} pageIds - Complete list of page IDs to assign
 * @returns {Promise<Object>} Updated role with permissions, menus, and pages resolved
 */
async function setRolePages(roleId, pageIds) {
  await setRoleRelations(roleId, pageIds, "rbac_role_pages", "page_id");
  return getRoleById(roleId);
}


/**
 * Returns all RBAC modules ordered by sort_order with a permission_count for each.
 * Usage: Called by rbacController.getModules
 * @returns {Promise<Array<Object>>} Module rows each including a permission_count
 */
async function getModules() {
  const res = await pool.query(
    `SELECT m.*,
            (SELECT COUNT(*) FROM rbac_permissions WHERE module_id = m.id) AS permission_count
     FROM rbac_modules m
     ORDER BY m.sort_order, m.label`
  );
  return res.rows;
}

/**
 * Creates a new RBAC module and auto-provisions the standard CRUD + export/import permissions
 * for it so the module is immediately usable in role assignments.
 * Usage: Called by rbacController.createModule
 * @param {Object} opts - Module creation data
 * @param {string} opts.key - Required unique module key
 * @param {string} opts.label - Required display label
 * @param {string} [opts.icon] - Icon identifier
 * @param {number} [opts.sort_order=0] - Display sort order
 * @returns {Promise<Object>} Newly created rbac_modules row
 */
async function createModule({ key, label, icon, sort_order = 0 }) {
  if (!key?.trim() || !label?.trim()) throw err("key and label are required.");
  const res = await pool.query(
    `INSERT INTO rbac_modules (key, label, icon, sort_order)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [key.trim(), label.trim(), icon || null, sort_order]
  );
  const mod = res.rows[0];
  // Seed all standard actions so callers can assign fine-grained permissions immediately
  const actions = STANDARD_PERMISSION_ACTIONS;
  await Promise.all(
    actions.map((action) =>
      pool.query(
        `INSERT INTO rbac_permissions (module_id, action, description)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [mod.id, action, `${label} — ${action}`]
      )
    )
  );
  return mod;
}

/**
 * Applies a partial update to an RBAC module using only the provided fields.
 * Usage: Called by rbacController.updateModule
 * @param {number} id - Module primary key
 * @param {Object} opts - Fields to update
 * @param {string} [opts.key] - Module key identifier
 * @param {string} [opts.label] - Display label
 * @param {string} [opts.icon] - Icon identifier
 * @param {number} [opts.sort_order] - Display sort order
 * @param {boolean} [opts.is_active] - Active flag
 * @returns {Promise<Object>} Updated rbac_modules row
 */
async function updateModule(id, { key, label, icon, sort_order, is_active }) {
  const fields = [];
  const params = [];

  if (key        !== undefined) { params.push(key.trim()); fields.push(`key = $${params.length}`); }
  if (label      !== undefined) { params.push(label.trim()); fields.push(`label = $${params.length}`); }
  if (icon       !== undefined) { params.push(icon);       fields.push(`icon = $${params.length}`); }
  if (sort_order !== undefined) { params.push(sort_order); fields.push(`sort_order = $${params.length}`); }
  if (is_active  !== undefined) { params.push(is_active);  fields.push(`is_active = $${params.length}`); }

  if (!fields.length) throw err("No fields to update.");

  params.push(id);
  const res = await pool.query(
    `UPDATE rbac_modules SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (!res.rows.length) throw err("Module not found.", 404);
  return res.rows[0];
}

/**
 * Toggles the is_active flag on an RBAC module (enable/disable).
 * Usage: Called by rbacController.toggleModuleStatus
 * @param {number} id - Module primary key
 * @returns {Promise<Object>} Updated rbac_modules row
 */
async function toggleModuleStatus(id) {
  const res = await pool.query(
    `UPDATE rbac_modules SET is_active = NOT is_active WHERE id = $1 RETURNING *`,
    [id]
  );
  if (!res.rows.length) throw err("Module not found.", 404);
  return res.rows[0];
}

/**
 * Returns all RBAC permissions joined with their parent module, ordered by module sort order.
 * Usage: Called by rbacController.getPermissions
 * @returns {Promise<Array<{ id, action, description, module_id, module_key, module_label, sort_order }>>}
 */
async function getPermissions() {
  const res = await pool.query(
    `SELECT p.id, p.action, p.description,
            m.id AS module_id, m.key AS module_key, m.label AS module_label, m.sort_order
     FROM rbac_permissions p
     JOIN rbac_modules m ON m.id = p.module_id
     ORDER BY m.sort_order, p.action`
  );
  return res.rows;
}
/**
 * Returns all RBAC menus ordered by sort_order and label.
 * Usage: Called by rbacController.getMenus
 * @returns {Promise<Array<Object>>} Menu rows from rbac_menus
 */
async function getMenus() {
  const res = await pool.query(
    `SELECT * FROM rbac_menus ORDER BY sort_order, label`
  );
  return res.rows;
}

/**
 * Creates a new RBAC menu item, optionally nested under a parent menu.
 * Usage: Called by rbacController.createMenu
 * @param {Object} opts - Menu creation data
 * @param {string} opts.key - Required unique menu key
 * @param {string} opts.label - Required display label
 * @param {string} [opts.icon] - Icon identifier
 * @param {string} [opts.parent_key] - Parent menu key for nested items
 * @param {number} [opts.sort_order=0] - Display sort order
 * @returns {Promise<Object>} Newly created rbac_menus row
 */
async function createMenu({ key, label, icon, parent_key, sort_order = 0 }) {
  if (!key?.trim() || !label?.trim()) throw err("key and label are required.");
  const res = await pool.query(
    `INSERT INTO rbac_menus (key, label, icon, parent_key, sort_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [key.trim(), label.trim(), icon || null, parent_key || null, sort_order]
  );
  return res.rows[0];
}

/**
 * Applies a partial update to an RBAC menu item using only the provided fields.
 * Usage: Called by rbacController.updateMenu
 * @param {number} id - Menu primary key
 * @param {Object} opts - Fields to update
 * @param {string} [opts.key] - Menu key identifier
 * @param {string} [opts.label] - Display label
 * @param {string} [opts.icon] - Icon identifier
 * @param {string} [opts.parent_key] - Parent menu key
 * @param {number} [opts.sort_order] - Display sort order
 * @param {boolean} [opts.is_active] - Active flag
 * @returns {Promise<Object>} Updated rbac_menus row
 */
async function updateMenu(id, { key, label, icon, parent_key, sort_order, is_active }) {
  const fields = [];
  const params = [];

  if (key        !== undefined) { params.push(key?.trim());  fields.push(`key = $${params.length}`); }
  if (label      !== undefined) { params.push(label?.trim()); fields.push(`label = $${params.length}`); }
  if (icon       !== undefined) { params.push(icon);          fields.push(`icon = $${params.length}`); }
  if (parent_key !== undefined) { params.push(parent_key);    fields.push(`parent_key = $${params.length}`); }
  if (sort_order !== undefined) { params.push(sort_order);    fields.push(`sort_order = $${params.length}`); }
  if (is_active  !== undefined) { params.push(is_active);     fields.push(`is_active = $${params.length}`); }

  if (!fields.length) throw err("No fields to update.");

  params.push(id);
  const res = await pool.query(
    `UPDATE rbac_menus SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (!res.rows.length) throw err("Menu item not found.", 404);
  return res.rows[0];
}
/**
 * Returns all RBAC pages ordered by label.
 * Usage: Called by rbacController.getPages
 * @returns {Promise<Array<Object>>} Page rows from rbac_pages
 */
async function getPages() {
  const res = await pool.query(
    `SELECT * FROM rbac_pages ORDER BY label`
  );
  return res.rows;
}
/**
 * Resolves the effective permissions, menus, and pages for a user. Admins receive all active
 * permissions unconditionally; other users receive only what is granted through their assigned roles.
 * Usage: Called by rbacController.getUserAccess and internally by getUserAccessSummary
 * @param {number} userId - User primary key
 * @returns {Promise<{ permissions: Array<Object>, menus: Array<Object>, pages: Array<Object>, customer_type: string, is_admin: boolean }>}
 */
async function getUserAccess(userId) {
  const userRes = await pool.query(
    "SELECT role, customer_type FROM users WHERE id = $1",
    [userId]
  );
  if (!userRes.rows.length) throw err("User not found.", 404);

  const { role, customer_type } = userRes.rows[0];

  // Admin bypass: skip role lookups and grant access to every active resource
  if (role === "admin") {
    const [perms, menus, pages] = await Promise.all([
      pool.query(
        `SELECT m.key AS module_key, p.action
         FROM rbac_permissions p
         JOIN rbac_modules m ON m.id = p.module_id
         WHERE m.is_active = true`
      ),
      pool.query(
        `SELECT key, label, icon, parent_key, sort_order
         FROM rbac_menus WHERE is_active = true ORDER BY sort_order`
      ),
      pool.query(
        `SELECT key, label, route, module_key FROM rbac_pages WHERE is_active = true`
      ),
    ]);
    return {
      permissions:   perms.rows,
      menus:         menus.rows,
      pages:         pages.rows,
      customer_type: customer_type || "Employee",
      is_admin:      true,
    };
  }

  const [perms, menus, pages] = await Promise.all([
    pool.query(
      `SELECT DISTINCT m.key AS module_key, p.action
       FROM user_roles ur
       JOIN rbac_role_permissions rp ON rp.role_id = ur.role_id
       JOIN rbac_permissions p ON p.id = rp.permission_id
       JOIN rbac_modules m ON m.id = p.module_id
       WHERE ur.user_id = $1 AND m.is_active = true`,
      [userId]
    ),
    pool.query(
      `SELECT DISTINCT mn.key, mn.label, mn.icon, mn.parent_key, mn.sort_order
       FROM user_roles ur
       JOIN rbac_role_menus rm ON rm.role_id = ur.role_id
       JOIN rbac_menus mn ON mn.id = rm.menu_id
       WHERE ur.user_id = $1 AND mn.is_active = true
       ORDER BY mn.sort_order`,
      [userId]
    ),
    pool.query(
      `SELECT DISTINCT pg.key, pg.label, pg.route, pg.module_key
       FROM user_roles ur
       JOIN rbac_role_pages rp ON rp.role_id = ur.role_id
       JOIN rbac_pages pg ON pg.id = rp.page_id
       WHERE ur.user_id = $1 AND pg.is_active = true`,
      [userId]
    ),
  ]);

  return {
    permissions:   perms.rows,
    menus:         menus.rows,
    pages:         pages.rows,
    customer_type: customer_type || "Employee",
    is_admin:      false,
  };
}

/**
 * Builds a detailed access summary for the user-detail view: combines user info, effective access,
 * all available resources, restricted resource lists, per-role permission sources (for non-admins),
 * and an audit change count.
 * Usage: Called by rbacController.getUserAccessSummary
 * @param {number} userId - User primary key
 * @returns {Promise<{ user: Object, access: Object, all_modules: Array, all_menus: Array, all_pages: Array, restricted_modules: Array, restricted_pages: Array, permission_sources: Array, audit_summary: Object }>}
 */
async function getUserAccessSummary(userId) {
  const userRes = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.role, u.customer_type,
            u.department, u.phone, u.is_active, u.last_login, u.avatar_url,
            TO_CHAR(u.created_at, 'Mon DD, YYYY') AS created_at,
            u.created_at AS created_at_raw,
            COALESCE(
              json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name, 'description', r.description))
              FILTER (WHERE r.id IS NOT NULL), '[]'
            ) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN rbac_roles r  ON r.id = ur.role_id
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId]
  );
  if (!userRes.rows.length) throw err("User not found.", 404);
  const user = userRes.rows[0];

  const access = await getUserAccess(userId);

  const [allModulesRes, allMenusRes, allPagesRes, auditRes] = await Promise.all([
    pool.query(`SELECT key, label, icon FROM rbac_modules WHERE is_active = true ORDER BY sort_order, label`),
    pool.query(`SELECT key, label, icon FROM rbac_menus WHERE is_active = true ORDER BY sort_order`),
    pool.query(`SELECT key, label, route, module_key FROM rbac_pages WHERE is_active = true ORDER BY label`),
    pool.query(
      `SELECT COUNT(*) AS total_changes, MAX(created_at) AS last_change
       FROM permission_audit_logs WHERE target_user_id = $1`,
      [userId]
    ),
  ]);

  // permissionSources traces each permission back to the role that granted it,
  // enabling the UI to explain why a user has a given access right.
  let permissionSources = [];
  if (!access.is_admin) {
    const srcRes = await pool.query(
      `SELECT r.id AS role_id, r.name AS role_name,
              m.key AS module_key, m.label AS module_label, p.action
       FROM user_roles ur
       JOIN rbac_roles r ON r.id = ur.role_id
       JOIN rbac_role_permissions rp ON rp.role_id = ur.role_id
       JOIN rbac_permissions p ON p.id = rp.permission_id
       JOIN rbac_modules m ON m.id = p.module_id
       WHERE ur.user_id = $1 AND m.is_active = true
       ORDER BY r.name, m.sort_order, p.action`,
      [userId]
    );
    permissionSources = srcRes.rows;
  }

  // Derive restricted lists by diffing all active resources against granted ones
  const accessibleModuleKeys = new Set(access.permissions.map((p) => p.module_key));
  const accessiblePageKeys   = new Set(access.pages.map((p) => p.key));

  return {
    user,
    access,
    all_modules:        allModulesRes.rows,
    all_menus:          allMenusRes.rows,
    all_pages:          allPagesRes.rows,
    restricted_modules: allModulesRes.rows.filter((m) => !accessibleModuleKeys.has(m.key)),
    restricted_pages:   allPagesRes.rows.filter((p) => !accessiblePageKeys.has(p.key)),
    permission_sources: permissionSources,
    audit_summary: {
      total_changes: parseInt(auditRes.rows[0].total_changes, 10) || 0,
      last_change:   auditRes.rows[0].last_change || null,
    },
  };
}

module.exports = {
  getUsers, getUserById, createUser, updateUser, toggleUserStatus, assignUserRoles,
  getRoles, getRoleById, createRole, updateRole, deleteRole, cloneRole,
  setRolePermissions, setRoleMenus, setRolePages,
  getModules, createModule, updateModule, toggleModuleStatus,
  getPermissions,
  getMenus, createMenu, updateMenu,
  getPages,
  getUserAccess,
  getUserAccessSummary,
};
