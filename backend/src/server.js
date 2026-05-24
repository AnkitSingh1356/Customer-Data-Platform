//cdp-backend\src\server.js
require("dotenv").config();

const express        = require("express");
const cors           = require("cors");
const path           = require("path");

const customerRoutes = require("./routes/customerRoutes");
const segmentRoutes  = require("./routes/segmentRoutes");
const authRoutes     = require("./routes/authRoutes");
const dealerRoutes   = require("./routes/dealerRoutes");
const behavioralAnalyticsRoutes = require("./routes/behavioralAnalyticsRoutes");
const consentComplianceRoutes = require("./routes/consentComplianceRoutes");
const app  = express();
const PORT = parseInt(process.env.PORT || "5000");

app.use(cors({
origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));


app.get("/health", (_req, res) => {
res.json({
status: "ok",
timestamp: new Date().toISOString(),
});
});


app.use("/api/customers", customerRoutes);
app.use("/api/segments", segmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dealers", dealerRoutes);
app.use("/api/behavioral-analytics", behavioralAnalyticsRoutes);

app.use(
    "/api/consent-compliance",
    consentComplianceRoutes
  );

app.use((err, _req, res, _next) => {
console.error("[Server Error]", err);

res.status(err.status || 500).json({
error: err.message || "Internal server error",
});
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
