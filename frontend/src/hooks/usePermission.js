import { useRBAC } from "../auth/RBACContext";

export function usePermission(moduleKey, action) {
  const { hasPermission } = useRBAC();
  return hasPermission(moduleKey, action);
}
