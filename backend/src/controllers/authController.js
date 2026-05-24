const svc = require("../services/authService");

const handleErr = (res, err) =>
  res.status(err.status || 500).json({ error: err.message || "Server error" });

async function register(req, res) {
  try {
    const result = await svc.register(req.body);
    return res.status(201).json(result);
  } catch (e) {
    console.error("REGISTER CONTROLLER ERROR:", e);
    return handleErr(res, e);
    }    
}

async function login(req, res) {
  try {
    const result = await svc.login(req.body);
    return res.json(result);
  } catch (e) {
    console.error("REGISTER CONTROLLER ERROR:", e);
    return handleErr(res, e);
    }
    
}

async function me(req, res) {
  try {
    const user = await svc.getProfile(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json(user);
  } catch (e) { return handleErr(res, e); }
}

async function updateProfile(req, res) {
  try {
    const user = await svc.updateProfile(req.user.id, req.body);
    return res.json(user);
  } catch (e) { return handleErr(res, e); }
}

async function changePassword(req, res) {
  try {
    const result = await svc.changePassword(req.user.id, req.body);
    return res.json(result);
  } catch (e) { return handleErr(res, e); }
}

module.exports = { register, login, me, updateProfile, changePassword };
