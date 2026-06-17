const { verifyToken } = require("../services/authService");
const pool = require("../config/db");

// Validates the Bearer JWT and confirms the account is still active in the DB.
// Attaches the decoded token payload to req.user for downstream route handlers.
async function requireAuth(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const decoded = verifyToken(token);
    // Re-check the DB on every request so deactivated accounts are blocked
    // immediately, even if their token has not yet expired
    const { rows } = await pool.query(
      "SELECT is_active FROM users WHERE id = $1",
      [decoded.id]
    );
    if (!rows.length || rows[0].is_active === false) {
      return res.status(403).json({ error: "Your account has been deactivated." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    // Surface token expiry as a distinct message so the client can prompt re-login
    const msg = err.name === "TokenExpiredError"
      ? "Session expired. Please log in again."
      : "Invalid token.";
    return res.status(401).json({ error: msg });
  }
}

module.exports = requireAuth;
