# CDP Backend 

Node.js + Express + PostgreSQL backend for the Customer 360 Bulk Upload feature.

## Quick Start

### 1. PostgreSQL Setup
```bash
createdb cdp_db
psql -U postgres -d cdp_db -f schema.sql
```

### 2. Environment
```bash
cp .env.example .env
# Edit .env with your DB credentials
```

### 3. Install & Run
```bash
npm install
npm run dev        # development (nodemon)
npm start          # production
```

Server starts at **http://localhost:5000**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/health` | Health check |
| GET  | `/api/customers` | List customers (paginated, filterable) |
| GET  | `/api/customers/stats` | Dashboard stat cards |
| GET  | `/api/customers/template` | Download CSV template |
| POST | `/api/customers/bulk-upload` | Start a bulk upload job |
| GET  | `/api/customers/bulk-upload/:jobId` | Poll job status |

### POST /api/customers/bulk-upload

- Content-Type: `multipart/form-data`
- Field name: `file` (CSV)
- Max size: 10 MB (configurable via `MAX_FILE_SIZE_MB`)
- Max rows: 10,000 (configurable via `MAX_ROWS_PER_UPLOAD`)

**Response (202):**
```json
{ "jobId": "uuid-...", "message": "Upload accepted." }
```

### GET /api/customers/bulk-upload/:jobId

Poll every ~1.2s until `status` is `completed` or `failed`.

```json
{
  "jobId": "uuid-...",
  "status": "completed",
  "total_rows": 150,
  "success_count": 148,
  "failed_count": 2,
  "error_log": ["Row 12: Invalid email ...", "Row 45: Missing first_name"]
}
```

---

## CSV Format

Required columns: `first_name`, `email`

All columns:
```
first_name, last_name, email, phone, customer_type, primary_source, status, dealer_code
```

Duplicate detection: **email** (upsert on conflict)

---

## Database Tables

- `customers` — master customer records
- `bulk_upload_jobs` — upload job tracking (status, counts, error log)
- `upload_errors` — per-row error details
# Customer-Data-Platform
