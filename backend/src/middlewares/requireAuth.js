const { verifyToken } = require("../services/authService");
const pool = require("../config/db");

async function requireAuth(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const decoded = verifyToken(token);
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
    const msg = err.name === "TokenExpiredError"
      ? "Session expired. Please log in again."
      : "Invalid token.";
    return res.status(401).json({ error: msg });
  }
}

module.exports = requireAuth;
