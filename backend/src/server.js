require("dotenv").config();

const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const rateLimit   = require("express-rate-limit");

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

app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || "http://localhost:5173",
  methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many requests, please slow down." },
});

// Strict limit on auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many attempts, please try again later." },
});

app.use(globalLimiter);
app.use("/api/auth/login",    authLimiter);
app.use("/api/auth/register", authLimiter);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

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
