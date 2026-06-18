import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { rbacApi } from "../services/rbacService";

const RBACContext = createContext(null);

// Safe default used before the API responds or when the user is logged out
const EMPTY_ACCESS = {
  permissions:   [],
  menus:         [],
  pages:         [],
  customer_type: "Employee",
  is_admin:      false,
};

/**
 * Provides RBAC access state and permission-check helpers to the entire app.
 * Usage: Place inside AuthProvider in the component tree; consume values via the useRBAC hook.
 * Fetches permissions from the API on login and resets to safe defaults on logout.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components that need RBAC context
 * @returns {JSX.Element}
 */
export function RBACProvider({ children }) {
  const { isAuthenticated, authHeader } = useAuth();
  const [access,  setAccess]  = useState(EMPTY_ACCESS);
  const [loading, setLoading] = useState(false);

  /**
   * Re-fetches the current user's RBAC access data (permissions, menus, pages) from the API.
   * Usage: Called automatically on authentication change; call manually after role assignments.
   * Fails silently to preserve existing access state if the API is temporarily unavailable.
   * @returns {Promise<void>}
   */
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await rbacApi.getMyAccess(authHeader());
      setAccess(data);
    } catch {
      // Fail silently — existing persona-based access remains intact
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authHeader]);

  // Fetch permissions on login; reset to safe defaults on logout
  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setAccess(EMPTY_ACCESS);
    }
  }, [isAuthenticated]);

  // Flattens permissions into a "module_key:action" Set for O(1) lookup
  const permSet = useMemo(() => {
    const s = new Set();
    access.permissions.forEach((p) => s.add(`${p.module_key}:${p.action}`));
    return s;
  }, [access.permissions]);

  const menuSet = useMemo(
    () => new Set(access.menus.map((m) => m.key)),
    [access.menus]
  );

  const pageSet = useMemo(
    () => new Set(access.pages.map((p) => p.key)),
    [access.pages]
  );

  /**
   * Checks whether the current user has a specific module/action permission.
   * Usage: Use via the usePermission hook or directly in PermissionGate.
   * @param {string} moduleKey - The RBAC module key (e.g. "segments", "dealers")
   * @param {string} action - The action to check (e.g. "create", "delete", "export")
   * @returns {boolean} True if the user is an admin or holds the explicit permission grant
   */
  const hasPermission = useCallback(
    (moduleKey, action) => access.is_admin || permSet.has(`${moduleKey}:${action}`),
    [access.is_admin, permSet]
  );

  /**
   * Checks whether the current user can access a specific sidebar menu item.
   * Usage: Used by Sidebar to filter nav items before rendering.
   * @param {string} menuKey - The menu item key (e.g. "segments", "dealerNetwork")
   * @returns {boolean} True if the user is an admin or the menu key is in their assigned set
   */
  const canAccessMenu = useCallback(
    (menuKey) => access.is_admin || menuSet.has(menuKey),
    [access.is_admin, menuSet]
  );

  /**
   * Checks whether the current user can access a specific application page.
   * Usage: Use in route guards to allow or redirect access by page key.
   * @param {string} pageKey - The page key to check (e.g. "segments-page", "dealers-page")
   * @returns {boolean} True if the user is an admin or the page key is in their assigned set
   */
  const canAccessPage = useCallback(
    (pageKey) => access.is_admin || pageSet.has(pageKey),
    [access.is_admin, pageSet]
  );

  const value = useMemo(() => ({
    access,
    loading,
    refresh,
    hasPermission,
    canAccessMenu,
    canAccessPage,
    customerType: access.customer_type,
    isAdmin:      access.is_admin,
  }), [access, loading, refresh, hasPermission, canAccessMenu, canAccessPage]);

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const ctx = useContext(RBACContext);
  if (!ctx) throw new Error("useRBAC must be used inside <RBACProvider>");
  return ctx;
}
