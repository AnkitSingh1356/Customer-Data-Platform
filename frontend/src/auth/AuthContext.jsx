import { createContext, useContext, useState, useEffect, useCallback } from "react";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;
// localStorage keys used to survive page refreshes without re-authentication
const TOKEN_KEY = "cdp_token";
const USER_KEY  = "cdp_user";

const AuthContext = createContext(null);

/**
 * Writes the JWT and user object to localStorage so the session survives a page reload.
 * @param {string} token - The JWT access token
 * @param {Object} user - The authenticated user object
 * @returns {void}
 */
const persist = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
/**
 * Removes the JWT token and user object from localStorage on logout.
 * @returns {void}
 */
const clear = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Provides authentication state (user, token, persona) and auth actions to the entire app.
 * Usage: Wrap the root of the app with AuthProvider; consume values via the useAuth hook.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components that need auth context
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  // Hydrate user from localStorage on first render; fall back to null if JSON is corrupt
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) ?? null; }
    catch { return null; }
  });
  // Hydrate token directly — it is a plain string, no parsing needed
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY) ?? null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Persona drives RBAC persona-based access; defaults to "admin" if role is absent
  const persona = user?.role ?? "admin";

  /**
   * Returns a Bearer Authorization header object for authenticated API calls.
   * Usage: Spread the return value into fetch headers or pass directly to service methods.
   * @returns {{ Authorization: string } | {}} Header object, or empty object if not authenticated
   */
  const authHeader = useCallback(() =>
    token ? { Authorization: `Bearer ${token}` } : {},
  [token]);

  /**
   * Authenticates the user with email and password, persisting the session to localStorage.
   * Usage: Call from the login form submit handler.
   * @param {Object} credentials
   * @param {string} credentials.email - User's email address
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} The authenticated user object
   */
  const login = useCallback(async ({ email, password }) => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const contentType = res.headers.get("content-type");

// Guard against HTML error pages (e.g. 502 gateway) being parsed as JSON
if (!contentType || !contentType.includes("application/json")) {
const text = await res.text();

console.error("NON-JSON RESPONSE:", text);

throw new Error(
"Server returned invalid response. Check backend terminal."
);
}

const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login failed");
      // Persist credentials so the session survives a hard refresh
      persist(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }, []);

  /**
   * Registers a new user and logs them in, persisting the session to localStorage.
   * Usage: Call from the registration form submit handler.
   * @param {Object} payload - Registration data (email, password, full_name, etc.)
   * @returns {Promise<Object>} The newly created and authenticated user object
   */
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

  /**
   * Clears the authentication session from state and localStorage.
   * Usage: Call when the user clicks the logout button.
   * @returns {void}
   */
  const logout = useCallback(() => {
    clear();
    setToken(null);
    setUser(null);
    setError("");
  }, []);

  /**
   * Re-fetches the current user's profile from the server and updates local state.
   * Usage: Called automatically on mount; call manually after profile changes.
   * Logs out automatically if the token is expired or the request fails.
   * @returns {Promise<void>}
   */
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

  /**
   * Updates the current user's profile fields and syncs changes to local state and localStorage.
   * Usage: Call from the profile settings form submit handler.
   * @param {Object} payload - Partial user fields to update (e.g. full_name, phone, department)
   * @returns {Promise<Object>} The updated user object
   */
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


  /**
   * Changes the current user's password via the authenticated API endpoint.
   * Usage: Call from the change-password form submit handler.
   * @param {Object} payload - Password change data (e.g. { current_password, new_password })
   * @returns {Promise<Object>} The API response confirming the password change
   */
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

  // Sync server-side profile once on mount to pick up any out-of-band changes
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
