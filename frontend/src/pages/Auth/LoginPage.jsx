import { useState } from "react";
import { useAuth }  from "../../auth/AuthContext";

const LoginPage = ({ onSwitchToSignup }) => {
  const { login, loading } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [showPwd,  setShowPwd]  = useState(false);

  // Client-side validation runs before the API call to give instant feedback
  const validate = () => {
    if (!email.trim())    return "Email address is required.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address.";
    if (!password)        return "Password is required.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    try {
      await login({ email: email.trim(), password });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {/* Branding */}
        <div className="auth-brand">
          <div className="auth-brand-dunlop">
            <svg width="110" height="22" viewBox="0 0 200 36" fill="none">
              <text x="0" y="28" fontFamily="Arial Black,sans-serif" fontSize="32" fontWeight="900" fill="#111">DUNLOP</text>
            </svg>
          </div>
          <div className="auth-brand-row">
            <span className="auth-brand-srixon">SRIXON</span>
            <span className="auth-brand-cleveland">Cleveland</span>
            <span className="auth-brand-golf">GOLF</span>
            <span className="auth-brand-xxio">XXIO</span>
          </div>
        </div>

        <h1 className="auth-title">Log in to your Account</h1>
        <p className="auth-subtitle">Welcome back to the Customer Data Platform.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <input
              className="auth-input"
              type="email"
              placeholder="name@dunlopsports.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-pwd-wrap">
              <input
                className="auth-input"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-pwd-toggle"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            className="auth-submit-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="btn-spinner"><span className="spinner" /> Logging in…</span> : "Log In"}
          </button>
        </form>

        <p className="auth-switch-text">
          Don't have an account?{" "}
          <button className="auth-switch-link" onClick={onSwitchToSignup}>Sign up</button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
