import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { rbacApi } from "../services/rbacService";

const RBACContext = createContext(null);

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

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setAccess(EMPTY_ACCESS);
    }
  }, [isAuthenticated]); 

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

  const hasPermission = useCallback(
    (moduleKey, action) => access.is_admin || permSet.has(`${moduleKey}:${action}`),
    [access.is_admin, permSet]
  );

  const canAccessMenu = useCallback(
    (menuKey) => access.is_admin || menuSet.has(menuKey),
    [access.is_admin, menuSet]
  );

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
