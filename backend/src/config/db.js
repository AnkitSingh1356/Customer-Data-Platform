const { Pool } = require("pg");
require("dotenv").config();

// Shared connection pool — max 10 clients keeps resource usage predictable under load
const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME     || "cdp_db",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  max: 10,
  // Release idle clients after 30 s to avoid holding stale connections
  idleTimeoutMillis: 30000,
  // Fail fast if the DB is unreachable rather than queuing requests indefinitely
  connectionTimeoutMillis: 5000,
});

// Log background pool errors (e.g. dropped idle connections) without crashing
pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

pool.connect()
  .then((client) => {
    console.log("✅ PostgreSQL connected successfully");
    client.release();
  })
  .catch((err) => {
    console.error("[DB] Failed to connect to PostgreSQL:", err.message);
    process.exit(1);
  });

module.exports = pool;
