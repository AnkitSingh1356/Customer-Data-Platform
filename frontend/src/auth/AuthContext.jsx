import { createContext, useContext, useState, useEffect, useCallback } from "react";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;
const TOKEN_KEY = "cdp_token";
const USER_KEY  = "cdp_user";

const AuthContext = createContext(null);

const persist = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
const clear = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) ?? null; }
    catch { return null; }
  });
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY) ?? null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const persona = user?.role ?? "admin";

  const authHeader = useCallback(() =>
    token ? { Authorization: `Bearer ${token}` } : {},
  [token]);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const contentType = res.headers.get("content-type");

if (!contentType || !contentType.includes("application/json")) {
const text = await res.text();

console.error("NON-JSON RESPONSE:", text);

throw new Error(
"Server returned invalid response. Check backend terminal."
);
}

const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login failed");
      persist(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get("content-type");

if (!contentType || !contentType.includes("application/json")) {
const text = await res.text();

console.error("NON-JSON RESPONSE:", text);

throw new Error(
"Server returned invalid response. Check backend terminal."
);
}

const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Registration failed");
      persist(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    clear();
    setToken(null);
    setUser(null);
    setError("");
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${BASE}/me`, { headers: authHeader() });
      if (!res.ok) { logout(); return; }
      const data = await res.json();
      setUser(data);
      localStorage.setItem(USER_KEY, JSON.stringify(data));
    } catch { logout(); }
  }, [token, authHeader, logout]);

  const updateProfile = useCallback(async (payload) => {

    const res = await fetch(`${BASE}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(payload),
    });
  
    const data = await res.json();
  
    if (!res.ok) {
      throw new Error(data.error || "Update failed");
    }
  
    const updatedUser = {
      ...user,
      ...data,
    };
  
    setUser(updatedUser);
  
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(updatedUser)
    );
  
    return updatedUser;
  
  }, [authHeader, user]);


  const changePassword = useCallback(async (payload) => {
    const res  = await fetch(`${BASE}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Password change failed");
    return data;
  }, [authHeader]);

  useEffect(() => {
    if (token) refreshProfile();
  }, []); 

  const value = {
    user, token, persona, loading, error,
    isAuthenticated: !!token && !!user,
    authHeader,
    login, register, logout, refreshProfile, updateProfile, changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
