import { useState } from "react";
import { useAuth }  from "../../auth/AuthContext";

const CUSTOMER_TYPES = [
  { value: "Dealer",       label: "Dealer" },
  { value: "B2B Customer", label: "B2B Customer" },
  { value: "B2C Customer", label: "B2C Customer" },
  { value: "Employee",     label: "Employee" },
];

const SignupPage = ({ onSwitchToLogin }) => {
  const { register, loading } = useAuth();
  const [form,  setForm]  = useState({
    full_name: "", email: "", password: "", confirm: "",
    account_type: "customer",      
    customer_type: "Dealer",        
    department: "",
  });
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const isCustomer = form.account_type === "customer";

  const validate = () => {
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.email.trim())     return "Email address is required.";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email address.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    try {
      await register({
        full_name:     form.full_name.trim(),
        email:         form.email.trim(),
        password:      form.password,
        role:          isCustomer ? "customer" : "admin",
        customer_type: isCustomer ? form.customer_type : "Employee",
        department:    form.department.trim() || undefined,
      });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card auth-card-wide">
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

        <h1 className="auth-title">Create your Account</h1>
        <p className="auth-subtitle">Join the Customer Data Platform.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field-row">
            <div className="auth-field">
              <label className="auth-label">Full Name *</label>
              <input className="auth-input" type="text" placeholder="Ankit Singh"
                value={form.full_name} onChange={(e) => set("full_name", e.target.value)} autoFocus />
            </div>
            <div className="auth-field">
              <label className="auth-label">Department</label>
              <input className="auth-input" type="text" placeholder="e.g. Marketing"
                value={form.department} onChange={(e) => set("department", e.target.value)} />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Email Address *</label>
            <input className="auth-input" type="email" placeholder="name@dunlopsports.com"
              value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
          </div>

          <div className="auth-field-row">
            <div className="auth-field">
              <label className="auth-label">Account Type *</label>
              <select
                className="auth-input auth-select"
                value={form.account_type}
                onChange={(e) => set("account_type", e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="customer">Customer</option>
              </select>
            </div>

            {isCustomer && (
              <div className="auth-field">
                <label className="auth-label">Customer Type *</label>
                <select
                  className="auth-input auth-select"
                  value={form.customer_type}
                  onChange={(e) => set("customer_type", e.target.value)}
                >
                  {CUSTOMER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="auth-field-row">
            <div className="auth-field">
              <label className="auth-label">Password *</label>
              <div className="auth-pwd-wrap">
                <input className="auth-input" type={showPwd ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />
                <button type="button" className="auth-pwd-toggle" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Confirm Password *</label>
              <input className="auth-input" type="password" placeholder="Repeat password"
                value={form.confirm} onChange={(e) => set("confirm", e.target.value)} autoComplete="new-password" />
            </div>
          </div>

          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading ? <span className="btn-spinner"><span className="spinner" /> Creating account…</span> : "Create Account"}
          </button>
        </form>

        <p className="auth-switch-text">
          Already have an account?{" "}
          <button className="auth-switch-link" onClick={onSwitchToLogin}>Log in</button>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
