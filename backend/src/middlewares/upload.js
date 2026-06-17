const multer = require("multer");
const path   = require("path");
const fs     = require("fs");
const { MAX_UPLOAD_MB, ALLOWED_MIME_TYPES } = require("../config/constants");

const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// Ensure the upload directory exists before any request is accepted
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (err) {
  console.error("[upload] Failed to create upload directory:", err.message);
  process.exit(1);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ts   = Date.now();
    // Sanitise the original name to prevent path traversal and special-char issues
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${ts}_${safe}`);
  },
});
// Reject non-CSV uploads by checking both extension and MIME type
const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".csv" && ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are accepted."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
});

module.exports = upload;
