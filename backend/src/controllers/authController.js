const svc = require("../services/authService");

/**
 * Normalises service/DB errors into a consistent JSON error response shape.
 * Usage: Called internally by all auth controller handlers on catch.
 * @param {import('express').Response} res - Express response object
 * @param {{ status?: number, message?: string }} err - Error thrown by the service layer
 * @returns {void} Sends a JSON error response with the appropriate HTTP status code
 */
const handleErr = (res, err) =>
  res.status(err.status || 500).json({ error: err.message || "Server error" });

/**
 * Creates a new user account and returns the created user record.
 * Usage: Called by Express router on POST /auth/register
 * @param {import('express').Request} req - req.body contains registration fields (e.g. name, email, password)
 * @param {import('express').Response} res - Sends JSON response
 * @returns {Promise<void>} 201 with the newly created user object, or error JSON on failure
 */
async function register(req, res) {
  try {
    const result = await svc.register(req.body);
    return res.status(201).json(result);
  } catch (e) {
    console.error("REGISTER CONTROLLER ERROR:", e);
    return handleErr(res, e);
    }
}

/**
 * Validates user credentials and returns a signed JWT token on success.
 * Usage: Called by Express router on POST /auth/login
 * @param {import('express').Request} req - req.body contains { email, password }
 * @param {import('express').Response} res - Sends JSON response
 * @returns {Promise<void>} JSON object containing the signed JWT token, or error JSON on failure
 */
async function login(req, res) {
  try {
    const result = await svc.login(req.body);
    return res.json(result);
  } catch (e) {
    console.error("REGISTER CONTROLLER ERROR:", e);
    return handleErr(res, e);
    }

}

/**
 * Returns the authenticated user's profile; requires a valid JWT in the request.
 * Usage: Called by Express router on GET /auth/me
 * @param {import('express').Request} req - req.user.id is populated by JWT auth middleware
 * @param {import('express').Response} res - Sends JSON response
 * @returns {Promise<void>} JSON user profile object, 404 if user no longer exists, or error JSON on failure
 */
async function me(req, res) {
  try {
    const user = await svc.getProfile(req.user.id);
    // Explicit 404 guard — service returns null when user has been deleted
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json(user);
  } catch (e) { return handleErr(res, e); }
}

/**
 * Updates mutable profile fields for the currently authenticated user.
 * Usage: Called by Express router on PUT /auth/me
 * @param {import('express').Request} req - req.user.id set by JWT middleware; req.body contains fields to update (e.g. name, email)
 * @param {import('express').Response} res - Sends JSON response
 * @returns {Promise<void>} JSON object with the updated user profile, or error JSON on failure
 */
async function updateProfile(req, res) {
  try {
    const user = await svc.updateProfile(req.user.id, req.body);
    return res.json(user);
  } catch (e) { return handleErr(res, e); }
}

/**
 * Verifies the user's current password then replaces it with a new bcrypt hash.
 * Usage: Called by Express router on POST /auth/change-password
 * @param {import('express').Request} req - req.user.id set by JWT middleware; req.body contains { currentPassword, newPassword }
 * @param {import('express').Response} res - Sends JSON response
 * @returns {Promise<void>} JSON success/confirmation object, or error JSON on failure
 */
async function changePassword(req, res) {
  try {
    const result = await svc.changePassword(req.user.id, req.body);
    return res.json(result);
  } catch (e) { return handleErr(res, e); }
}

module.exports = { register, login, me, updateProfile, changePassword };
