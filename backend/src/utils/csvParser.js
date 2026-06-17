const csv = require("csv-parser");
const fs  = require("fs");
const { MAX_CSV_ROWS } = require("../config/constants");

// Minimum fields a valid customer record must supply
const REQUIRED_FIELDS = ["first_name", "email"];

// Allowlist of columns that will be persisted; any extra CSV columns are silently dropped
const ACCEPTED_COLUMNS = new Set([
  "first_name", "last_name", "email", "phone",
  "customer_type", "primary_source", "status",
  "dealer_code",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ROWS  = MAX_CSV_ROWS;

// Matches cell values that would be interpreted as formulas if opened in a spreadsheet
const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/;

// Prepend a single quote to neutralise CSV injection / formula injection attacks
function sanitizeCell(value) {
  if (typeof value === "string" && FORMULA_PREFIX_RE.test(value)) {
    return "'" + value;
  }
  return value;
}

// Streams and validates a CSV file; resolves with { rows, errors } so the caller
// can persist valid rows and report per-row failures without aborting the whole batch.
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows   = [];
    const errors = [];
    let   rowNum = 1;
    let   stream = null;

    stream = fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
      .on("data", (raw) => {
        rowNum++;

        // Stop processing once the row cap is hit; destroy the stream to avoid
        // reading the rest of a potentially large file unnecessarily
        if (rowNum > MAX_ROWS + 1) {
          if (rowNum === MAX_ROWS + 2) {
            errors.push(`Exceeded max ${MAX_ROWS} rows — remaining rows were ignored.`);
            stream.destroy();
          }
          return;
        }

        const row = {};
        for (const [k, v] of Object.entries(raw)) {
          if (ACCEPTED_COLUMNS.has(k)) row[k] = sanitizeCell((v || "").trim());
        }

        const rowErrors = validateRow(row, rowNum);
        if (rowErrors.length) {
          errors.push(...rowErrors);
        } else {
          rows.push({ ...row, _rowNum: rowNum });
        }
      })
      .on("end",   () => resolve({ rows, errors }))
      .on("close", () => resolve({ rows, errors })) // fires when stream.destroy() is called
      .on("error", (err) => {
        stream.destroy();
        reject(err);
      });
  });
}

// Checks required fields, email format, and allowed status values for a single row.
// Returns an array of human-readable error strings (empty array means the row is valid).
function validateRow(row, rowNum) {
  const errs = [];

  for (const field of REQUIRED_FIELDS) {
    if (!row[field]) {
      errs.push(`Row ${rowNum}: Missing required field "${field}".`);
    }
  }

  if (row.email && !EMAIL_RE.test(row.email)) {
    errs.push(`Row ${rowNum}: Invalid email format — value rejected.`);
  }

  if (row.status && !["active", "inactive", "pending"].includes(row.status.toLowerCase())) {
    errs.push(`Row ${rowNum}: Unknown status value — must be Active, Inactive, or Pending.`);
  }

  return errs;
}

// Generates a downloadable CSV template with a header row and one example record
function buildTemplateCsv() {
  const headers = ["first_name", "last_name", "email", "phone",
                   "customer_type", "primary_source", "status", "dealer_code"];
  const example = ["John", "Smith", "john.smith@example.com", "+1-555-0100",
                   "B2C Customer", "Commerce Cloud", "Active", ""];
  return headers.join(",") + "\n" + example.join(",") + "\n";
}

module.exports = { parseCSV, buildTemplateCsv };
