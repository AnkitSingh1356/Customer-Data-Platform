require("dotenv").config();

const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const rateLimit   = require("express-rate-limit");
const { GLOBAL_RATE_WINDOW_MS, GLOBAL_RATE_MAX, AUTH_RATE_WINDOW_MS, AUTH_RATE_MAX } = require("./config/constants");

const customerRoutes               = require("./routes/customerRoutes");
const segmentRoutes                = require("./routes/segmentRoutes");
const authRoutes                   = require("./routes/authRoutes");
const dealerRoutes                 = require("./routes/dealerRoutes");
const behavioralAnalyticsRoutes    = require("./routes/behavioralAnalyticsRoutes");
const consentComplianceRoutes      = require("./routes/consentComplianceRoutes");
const promotionalEffectivenessRoutes = require("./routes/promotionalEffectivenessRoutes");
const identityResolutionRoutes     = require("./routes/identityResolutionRoutes");
const rbacRoutes                   = require("./routes/rbacRoutes");
const auditRoutes                  = require("./routes/auditRoutes");

const app  = express();
const PORT = parseInt(process.env.PORT || "5000");

// Security headers (X-Frame-Options, HSTS, X-Content-Type-Options, etc.)
app.use(helmet());

// Allow credentials so the frontend can send cookies/auth headers cross-origin
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || "http://localhost:5173",
  methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

// Broad throttle applied to every route to guard against denial-of-service
const globalLimiter = rateLimit({
  windowMs: GLOBAL_RATE_WINDOW_MS,
  max:      GLOBAL_RATE_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many requests, please slow down." },
});

// Strict limit on auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: AUTH_RATE_WINDOW_MS,
  max:      AUTH_RATE_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many attempts, please try again later." },
});

app.use(globalLimiter);
app.use("/api/auth/login",    authLimiter);
app.use("/api/auth/register", authLimiter);

// Cap JSON body size to prevent memory exhaustion from oversized payloads
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Lightweight liveness probe used by load balancers and container orchestrators
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/customers",               customerRoutes);
app.use("/api/segments",                segmentRoutes);
app.use("/api/auth",                    authRoutes);
app.use("/api/dealers",                 dealerRoutes);
app.use("/api/behavioral-analytics",    behavioralAnalyticsRoutes);
app.use("/api/consent-compliance",      consentComplianceRoutes);
app.use("/api/promotional-effectiveness", promotionalEffectivenessRoutes);
app.use("/api/identity-resolution",     identityResolutionRoutes);
app.use("/api/rbac",                    rbacRoutes);
app.use("/api/audit",                   auditRoutes);

// Centralised error handler — masks internal details for 5xx to avoid leaking stack traces
app.use((err, _req, res, _next) => {
  console.error("[Server Error]", err);
  const status  = err.status || 500;
  const message = status < 500 ? err.message : "Internal server error";
  res.status(status).json({ error: message });
});


app.listen(PORT, () => {
console.log(`\n✅ CDP Backend running on http://localhost:${PORT}`);

console.log(`\n Health`);
console.log(`   GET    /health`);

console.log(`\n Customers`);
console.log(`   GET    /api/customers`);
console.log(`   GET    /api/customers/stats`);
console.log(`   GET    /api/customers/template`);
console.log(`   POST   /api/customers/bulk-upload`);
console.log(`   GET    /api/customers/bulk-upload/:jobId`);

console.log(`\n Segments`);
console.log(`   GET    /api/segments`);
console.log(`   POST   /api/segments`);
console.log(`   GET    /api/segments/:id`);
console.log(`   PUT    /api/segments/:id`);
console.log(`   DELETE /api/segments/:id`);

console.log(`\n Authentication`);
console.log(`   POST   /api/auth/register`);
console.log(`   POST   /api/auth/login`);
console.log(`   GET    /api/auth/me`);
console.log(`   PUT    /api/auth/profile`);
console.log(`   PUT    /api/auth/password\n`);
});


module.exports = app;
