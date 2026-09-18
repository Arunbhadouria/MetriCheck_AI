# MetriCheck AI — API Specification

Base Endpoint: `/api/v1`

## Standard Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": []
  },
  "requestId": "req_1726500000"
}
```

---

## Auth Endpoints

### `POST /api/v1/auth/login`
Logs in inspector or administrator.
- **Request Body**: `{ "employeeId": "LM-MP-0421", "password": "password123" }`
- **Response**: `{ "success": true, "data": { "token": "JWT...", "user": { "id": "...", "employeeId": "LM-MP-0421", "role": "INSPECTOR" } } }`

### `POST /api/v1/auth/refresh`
Refreshes access token.

### `POST /api/v1/auth/logout`
Revokes active session.

### `GET /api/v1/auth/me`
Returns currently authenticated user profile.

---

## Inspections Endpoints

### `GET /api/v1/inspections`
Retrieves list of inspections with optional status, date, location filters.

### `POST /api/v1/inspections`
Creates a draft inspection.
- **Request Body**:
```json
{
  "inspectionType": "Routine",
  "jurisdictionState": "Madhya Pradesh",
  "jurisdictionDistrict": "Indore",
  "jurisdictionZone": "Zone 08 — Vijay Nagar",
  "marketName": "Malviya Nagar Market",
  "shopName": "Sharma General Store",
  "shopkeeperName": "Rajesh Sharma",
  "licenseNumber": "MP/LM/2024/8842"
}
```

### `GET /api/v1/inspections/:id`
Retrieves single inspection details including products, declarations, and rule results.

### `PATCH /api/v1/inspections/:id`
Updates inspection status or shop details.

### `POST /api/v1/inspections/:id/finalize`
Finalizes an inspection and sets status to `FINALIZED`.

---

## Analysis & OCR Endpoints

### `POST /api/v1/inspections/:id/analyze`
Creates an asynchronous perception job.
- **Response**:
```json
{
  "success": true,
  "data": {
    "analysisId": "anl_12345",
    "inspectionId": "insp_001",
    "status": "COMPLETED",
    "products": [...]
  }
}
```

### `GET /api/v1/analysis/:id`
Returns job status (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`).

---

## Declarations & Compliance Endpoints

### `GET /api/v1/products/:id/declarations`
Returns extracted label declarations for product.

### `PATCH /api/v1/declarations/:id`
Updates extracted declaration value and creates an audit event.

### `POST /api/v1/rule-results/:id/verify`
Inspector overrides or verifies compliance rule evaluation result.

---

## Reports Endpoints

### `GET /api/v1/inspections/:id/pdf`
Generates and streams official court-ready Legal Metrology PDF inspection report.

---

## Dashboard Endpoints

### `GET /api/v1/dashboard/summary`
Returns live DB metrics (todayInspections, compliant, nonCompliant, reviewRequired, openCases, pendingSync, recentInspections).
