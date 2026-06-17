import { useRBAC } from "../../auth/RBACContext";

/**
 * Renders children only when the current user has the specified permission.
 *
 * @param {string}  module   - Module key  (e.g. "segments")
 * @param {string}  action   - Action key  (e.g. "create" | "delete" | "export")
 * @param {*}       fallback - Rendered when permission is denied (default: null)
 */
export default function PermissionGate({ module: mod, action, fallback = null, children }) {
  const { hasPermission } = useRBAC();
  return hasPermission(mod, action) ? children : fallback;
}
