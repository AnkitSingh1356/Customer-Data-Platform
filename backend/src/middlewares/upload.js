//cdp-bulk-upload\cdp-backend\src\middlewares\upload.js
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ts   = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${ts}_${safe}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [".csv", "text/csv", "application/csv",
                   "application/vnd.ms-excel", "text/plain"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".csv" || allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are accepted."), false);
  }
};

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "10");

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

module.exports = upload;
