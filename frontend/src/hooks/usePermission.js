import { useRBAC } from "../auth/RBACContext";

/**
 * Convenience hook that checks whether the current user holds a specific RBAC permission.
 * Usage: use to gate individual UI elements (buttons, form fields) without needing to
 * access RBACContext directly.
 * @param {string} moduleKey - The RBAC module key (e.g. "segments", "dealers").
 * @param {string} action - The action to check (e.g. "create", "delete", "export").
 * @returns {boolean} True if the user is an admin or has the explicit permission grant.
 */
export function usePermission(moduleKey, action) {
  const { hasPermission } = useRBAC();
  return hasPermission(moduleKey, action);
}
