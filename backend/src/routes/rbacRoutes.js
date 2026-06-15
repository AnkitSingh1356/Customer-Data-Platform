const express     = require("express");
const router      = express.Router();
const ctrl        = require("../controllers/rbacController");
const requireAuth = require("../middlewares/requireAuth");

router.use(requireAuth);

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

router.get("/my-access", ctrl.myAccess);

router.get   ("/users",             ctrl.listUsers);
router.post  ("/users",             requireAdmin, ctrl.createUser);
router.get   ("/users/:id/summary", ctrl.getUserAccessSummary);
router.get   ("/users/:id",         ctrl.getUser);
router.put   ("/users/:id",         requireAdmin, ctrl.updateUser);
router.put   ("/users/:id/status",  requireAdmin, ctrl.toggleUserStatus);
router.put   ("/users/:id/roles",   requireAdmin, ctrl.assignUserRoles);

router.get    ("/roles",                 ctrl.listRoles);
router.post   ("/roles",                 requireAdmin, ctrl.createRole);
router.get    ("/roles/:id",             ctrl.getRole);
router.put    ("/roles/:id",             requireAdmin, ctrl.updateRole);
router.delete ("/roles/:id",             requireAdmin, ctrl.deleteRole);
router.post   ("/roles/:id/clone",       requireAdmin, ctrl.cloneRole);
router.put    ("/roles/:id/permissions", requireAdmin, ctrl.setRolePermissions);
router.put    ("/roles/:id/menus",       requireAdmin, ctrl.setRoleMenus);
router.put    ("/roles/:id/pages",       requireAdmin, ctrl.setRolePages);

router.get  ("/modules",            ctrl.listModules);
router.post ("/modules",            requireAdmin, ctrl.createModule);
router.put  ("/modules/:id",        requireAdmin, ctrl.updateModule);
router.put  ("/modules/:id/status", requireAdmin, ctrl.toggleModuleStatus);

router.get ("/permissions", ctrl.listPermissions);

router.get  ("/menus",     ctrl.listMenus);
router.post ("/menus",     requireAdmin, ctrl.createMenu);
router.put  ("/menus/:id", requireAdmin, ctrl.updateMenu);

router.get ("/pages", ctrl.listPages);

module.exports = router;
