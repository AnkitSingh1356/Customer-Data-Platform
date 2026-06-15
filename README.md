# Customer Data Platform (CDP)

A comprehensive Customer Data Platform built with a React frontend and a Node.js/Express + PostgreSQL backend. The platform provides a 360-degree view of customers, segmentation tools, behavioral analytics, compliance management, and a dealer network interface.

## Table of Contents
1. [Core Architecture](#core-architecture)
2. [Quick Start](#quick-start)
3. [Modules & Features](#modules--features)
    - [1. Authentication & Authorization](#1-authentication--authorization)
    - [2. Customer 360 & Profiles](#2-customer-360--profiles)
    - [3. Bulk Upload API](#3-bulk-upload-api)
    - [4. Dynamic Segments](#4-dynamic-segments)
    - [5. Behavioral Analytics](#5-behavioral-analytics)
    - [6. Consent & Compliance](#6-consent--compliance)
    - [7. Dealer Network](#7-dealer-network)
4. [Backend API Reference](#backend-api-reference)

---

## Core Architecture

- **Frontend:** React, Vite, React Router, CSS Modules/Tailwind, Context API for state management.
- **Backend:** Node.js, Express.js, RESTful APIs, Multer (for file uploads), JWT for authentication.
- **Database:** PostgreSQL.
- **Data Flow:** The backend handles complex queries, background processing (like CSV parsing), and structured database interactions, providing lightweight JSON payloads to the frontend.

---

## Quick Start

### 1. PostgreSQL Setup
```bash
createdb cdp_db
# Run the base schema and all module migrations
psql -U postgres -d cdp_db -f backend/schema.sql
psql -U postgres -d cdp_db -f backend/migration_auth.sql
psql -U postgres -d cdp_db -f backend/migration_profile.sql
psql -U postgres -d cdp_db -f backend/migration_segments.sql
psql -U postgres -d cdp_db -f backend/migration_dealers.sql
psql -U postgres -d cdp_db -f backend/migration_consent_compilance.sql
```

### 2. Backend Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials, JWT secrets, etc.
npm install
npm run dev        # Starts on http://localhost:5000
```

### 3. Frontend Environment
```bash
cd frontend
cp .env.example .env # If available, or set VITE_API_URL=http://localhost:5000
npm install
npm run dev        # Starts Vite dev server
```

---

## Modules & Features

### 1. Authentication & Authorization
**Overview:** Secure access control using JSON Web Tokens (JWT).
- **Features:** 
  - User Registration & Login.
  - Protected routes via middleware (`requireAuth.js`).
  - Frontend Context (`AuthContext.jsx`) to manage logged-in state across the application.
- **Key Tables:** `users`

### 2. Customer 360 & Profiles
**Overview:** The central hub for individual customer data, aggregating demographics, purchase history, and interactions.
- **Features:**
  - Search, filter, and paginate master customer lists.
  - Detailed `UserProfileModal` showing a unified view.
  - Automatic `CDP_ID` generation for unique customer tracking across systems.
- **Key Tables:** `customers`, `customer_profiles`

### 3. Bulk Upload API
**Overview:** High-performance, asynchronous CSV ingestion for mass customer updates.
- **Workflow:**
  1. Upload CSV (`multipart/form-data`). Returns `202 Accepted` with a `jobId`.
  2. Server parses CSV in the background handling up to 10,000 rows.
  3. Uses `email` for duplicate detection (Upsert on conflict).
  4. Client polls `/api/customers/bulk-upload/:jobId` every ~1.2s for completion status and error logs.
- **Key Tables:** `bulk_upload_jobs`, `upload_errors`

### 4. Dynamic Segments
**Overview:** A powerful rule builder allowing marketers to create dynamic audiences based on customer attributes and behaviors.
- **Features:**
  - UI `RuleBuilder` to define complex AND/OR logic (e.g., "Customer Type = VIP" AND "Source = Website").
  - Backend `segmentService.js` evaluates rules against the customer database to generate live audience lists.
- **Key Tables:** `segments`, `segment_rules`

### 5. Behavioral Analytics
**Overview:** Tracking and visualization of customer actions over time.
- **Features:**
  - KPI cards and dashboards showing engagement metrics.
  - Time-series tracking of events (page views, clicks, purchases).
- **Key Tables:** `behavioral_events`, `analytics_metrics`

### 6. Consent & Compliance
**Overview:** Essential tools for GDPR/CCPA compliance, managing communication preferences and data privacy.
- **Features:**
  - Track consent for Email, SMS, and Third-Party data sharing.
  - Audit trails for consent changes (who changed it, when, and from what IP).
  - Status badges clearly indicating opt-in/opt-out states.
- **Key Tables:** `consent_records`, `compliance_logs`

### 7. Dealer Network
**Overview:** Management interface for localized dealers and franchisees.
- **Features:**
  - Map customers to specific dealers (`dealer_code`).
  - Track dealer performance and lead assignment.
  - Bulk assignment capabilities via `dealerBulkService.js`.
- **Key Tables:** `dealers`, `dealer_assignments`

---

## Backend API Reference

### Health & Core
- `GET /health` : Health check

### Customers & Bulk Upload
- `GET /api/customers` : List customers (paginated, filterable)
- `GET /api/customers/stats` : Dashboard stat cards
- `GET /api/customers/template` : Download CSV template
- `POST /api/customers/bulk-upload` : Start a bulk upload job (Max 10MB, 10k rows)
- `GET /api/customers/bulk-upload/:jobId` : Poll job status

### Authentication
- `POST /api/auth/register` : Create a new user
- `POST /api/auth/login` : Authenticate and receive JWT

*(See individual route files in `backend/src/routes/` for full parameter and query options for Segments, Analytics, Compliance, and Dealers).*

---

### CSV Format Requirements (Bulk Upload)
Required columns: `first_name`, `email`
All columns: `first_name, last_name, email, phone, customer_type, primary_source, status, dealer_code`
