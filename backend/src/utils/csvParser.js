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

const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/;

function sanitizeCell(value) {
  if (typeof value === "string" && FORMULA_PREFIX_RE.test(value)) {
    return "'" + value;
  }
  return value;
}

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

function buildTemplateCsv() {
  const headers = ["first_name", "last_name", "email", "phone",
                   "customer_type", "primary_source", "status", "dealer_code"];
  const example = ["John", "Smith", "john.smith@example.com", "+1-555-0100",
                   "B2C Customer", "Commerce Cloud", "Active", ""];
  return headers.join(",") + "\n" + example.join(",") + "\n";
}

module.exports = { parseCSV, buildTemplateCsv };
