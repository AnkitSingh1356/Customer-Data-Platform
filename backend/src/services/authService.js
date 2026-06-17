const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const pool   = require("../config/db");
const { SALT_ROUNDS, JWT_EXPIRES, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } = require("../config/constants");

const JWT_SECRET  = process.env.JWT_SECRET;
// Fail fast at startup — a missing secret would silently break all auth
if (!JWT_SECRET) throw new Error("FATAL: JWT_SECRET environment variable is not set.");

// Signs a JWT with HS256; embeds role and customer_type for authorisation checks
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES, algorithm: "HS256" });
}

// Throws if the token is expired, tampered, or signed with the wrong secret
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
}

// Strips password_hash before returning user data to callers
function sanitize(row) {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return safe;
}

// Creates a new user account and returns a signed JWT alongside the sanitized user record
async function register({ full_name, email, password, customer_type, department, phone }) {
  if (!full_name?.trim() || !email?.trim() || !password) {
    throw Object.assign(new Error("full_name, email and password are required."), { status: 400 });
  }
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw Object.assign(new Error("Password must be between 8 and 128 characters."), { status: 400 });
  }

  // Guard against duplicate accounts before hashing (cheap check first)
  const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
  if (exists.rows.length) {
    throw Object.assign(new Error("An account with this email already exists."), { status: 409 });
  }

  // Hash the plaintext password before persisting
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // New accounts default to the least-privileged 'viewer' role
  const res = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, customer_type, department, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      full_name.trim(),
      email.toLowerCase().trim(),
      password_hash,
      "viewer",
      customer_type || "Employee",
      department    || null,
      phone         || null,
    ]
  );

  const user  = sanitize(res.rows[0]);
  const token = signToken({ id: user.id, email: user.email, role: user.role, customer_type: user.customer_type });
  return { token, user };
}

// Authenticates credentials and returns a fresh JWT; updates last_login on success
async function login({ email, password }) {
  if (!email?.trim() || !password) {
    throw Object.assign(new Error("Email and password are required."), { status: 400 });
  }

  // Generic error message prevents email enumeration
  const res = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
  if (!res.rows.length) {
    throw Object.assign(new Error("Invalid email or password."), { status: 401 });
  }

  const row = res.rows[0];

  // Check deactivation BEFORE bcrypt to avoid timing oracle on deactivated accounts.
  if (row.is_active === false) {
    throw Object.assign(new Error("Invalid email or password."), { status: 401 });
  }

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    throw Object.assign(new Error("Invalid email or password."), { status: 401 });
  }

  await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [row.id]);

  const user  = sanitize({ ...row, last_login: new Date() });
  const token = signToken({ id: user.id, email: user.email, role: user.role, customer_type: user.customer_type });
  return { token, user };
}

// Fetches the public profile fields for a given user; omits sensitive columns
async function getProfile(userId) {
  const res = await pool.query(
    `SELECT
      id,
      full_name,
      email,
      role,
      customer_type,
      department,
      phone,
      avatar_url,
      avatar_initials,
      bio,
      address,
      last_login,
      TO_CHAR(created_at, 'Mon DD, YYYY') AS joined_platform
    FROM users
    WHERE id = $1`,
    [userId]
  );

  return res.rows[0] ?? null;
}

// Updates mutable profile fields; returns the full updated profile without password_hash
async function updateProfile(
  userId,
  {
    full_name,
    department,
    phone,
    bio,
    address,
    avatar_url,
  }
) {

  if (!full_name?.trim()) {
    throw Object.assign(new Error("Full name is required."), { status: 400 });
  }

  // Reject relative or non-HTTP URLs that could be used for open-redirect abuse
  if (avatar_url && !/^https?:\/\/.+/.test(avatar_url)) {
    throw Object.assign(new Error("avatar_url must be a valid HTTP/HTTPS URL."), { status: 400 });
  }

  const res = await pool.query(
    `UPDATE users
     SET
       full_name = $1,
       department = $2,
       phone = $3,
       bio = $4,
       address = $5,
       avatar_url = $6
     WHERE id = $7
     RETURNING
       id,
       full_name,
       email,
       role,
       customer_type,
       department,
       phone,
       avatar_url,
       avatar_initials,
       bio,
       address,
       last_login,
       TO_CHAR(created_at, 'Mon DD, YYYY') AS joined_platform`,
    [
      full_name.trim(),
      department || null,
      phone || null,
      bio || null,
      address || null,
      avatar_url || null,
      userId,
    ]
  );

  return sanitize(res.rows[0]);
}
// Verifies the current password before replacing it; prevents unauthorised resets
async function changePassword(userId, { current_password, new_password }) {
  if (!current_password || !new_password) {
    throw Object.assign(new Error("Both current and new password are required."), { status: 400 });
  }
  if (new_password.length < PASSWORD_MIN_LENGTH || new_password.length > PASSWORD_MAX_LENGTH) {
    throw Object.assign(new Error("New password must be between 8 and 128 characters."), { status: 400 });
  }

  // Fetch only the hash column — avoid pulling unnecessary user data
  const res = await pool.query("SELECT password_hash FROM users WHERE id = $1", [userId]);
  if (!res.rows.length) throw Object.assign(new Error("User not found."), { status: 404 });

  const valid = await bcrypt.compare(current_password, res.rows[0].password_hash);
  if (!valid) throw Object.assign(new Error("Current password is incorrect."), { status: 401 });

  // Re-hash with current SALT_ROUNDS in case the cost factor was updated
  const hash = await bcrypt.hash(new_password, SALT_ROUNDS);
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);
  return { message: "Password updated successfully." };
}

module.exports = { register, login, getProfile, updateProfile, changePassword, verifyToken };
