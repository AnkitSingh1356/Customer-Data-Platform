//cdp-bulk-upload\cdp-backend\src\utils\csvParser.js
const csv = require("csv-parser");
const fs  = require("fs");

const REQUIRED_FIELDS = ["first_name", "email"];

const ACCEPTED_COLUMNS = new Set([
  "first_name", "last_name", "email", "phone",
  "customer_type", "primary_source", "status",
  "dealer_code",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ROWS  = parseInt(process.env.MAX_ROWS_PER_UPLOAD || "10000");

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows   = [];
    const errors = [];
    let   rowNum = 1; 

    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
      .on("data", (raw) => {
        rowNum++;

        if (rowNum > MAX_ROWS + 1) {
          errors.push(`Row ${rowNum}: Exceeded max ${MAX_ROWS} rows — remaining rows ignored.`);
          return;
        }

        const row = {};
        for (const [k, v] of Object.entries(raw)) {
          if (ACCEPTED_COLUMNS.has(k)) row[k] = (v || "").trim();
        }

        const rowErrors = validateRow(row, rowNum);
        if (rowErrors.length) {
          errors.push(...rowErrors);
        } else {
          rows.push({ ...row, _rowNum: rowNum });
        }
      })
      .on("end", () => resolve({ rows, errors }))
      .on("error", reject);
  });
}

function validateRow(row, rowNum) {
  const errs = [];

  for (const field of REQUIRED_FIELDS) {
    if (!row[field]) {
      errs.push(`Row ${rowNum}: Missing required field "${field}".`);
    }
  }

  if (row.email && !EMAIL_RE.test(row.email)) {
    errs.push(`Row ${rowNum}: Invalid email "${row.email}".`);
  }

  if (row.status && !["active", "inactive", "pending"].includes(row.status.toLowerCase())) {
    errs.push(`Row ${rowNum}: Unknown status "${row.status}" — must be Active/Inactive/Pending.`);
  }

  return errs;
}

function buildTemplateCsv() {
  const headers = ["first_name", "last_name", "email", "phone",
                   "customer_type", "primary_source", "status", "dealer_code"];
  const example = ["John", "Smith", "john.smith@example.com", "+1-555-0100",
                   "B2C Customer", "Commerce Cloud", "Active", ""];
  return headers.join(",") + "\n" + example.join(",") + "\n";
}

module.exports = { parseCSV, buildTemplateCsv };
