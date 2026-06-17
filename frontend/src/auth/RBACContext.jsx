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

export function RBACProvider({ children }) {
  const { isAuthenticated, authHeader } = useAuth();
  const [access,  setAccess]  = useState(EMPTY_ACCESS);
  const [loading, setLoading] = useState(false);

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

  // Admins bypass all permission checks; others must have an explicit grant
  const hasPermission = useCallback(
    (moduleKey, action) => access.is_admin || permSet.has(`${moduleKey}:${action}`),
    [access.is_admin, permSet]
  );

  // Admins see all menus; others require the menu key in their assigned set
  const canAccessMenu = useCallback(
    (menuKey) => access.is_admin || menuSet.has(menuKey),
    [access.is_admin, menuSet]
  );

  // Admins can visit any page; others require the page key in their assigned set
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
