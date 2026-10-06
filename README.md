# FORSEE Nexus

> **College-Scale Student Profile System & Institutional Identity Platform**  
> FORESE Development Team Recruitment 2026 Submission  
> *Production-minded architecture designed for ~6,000 students and high-concurrency campus workflows.*

---

## What It Is

**FORSEE Nexus** is a full-stack, college-scale student identity and profile management system developed for FORESE. It pairs a layered, concurrency-safe FastAPI backend with a distinctive, institutional React frontend designed under the **"Student Constellation"** visual philosophy.

Rather than resembling a generic SaaS dashboard or AI template, FORSEE Nexus presents student identity with editorial dignity, spatial clarity, and technical discipline.

---

## Why It Exists

Collegiate student bodies of approximately **6,000 students** generate distinct traffic characteristics:
1. **Burst Concurrency**: During campus placement registrations, mock interview slot bookings, or department profile updates, 100–300 users operate normally, with peaks reaching **~1,000 concurrent HTTP requests**.
2. **Concurrent Mutation & Lost Updates**: When students, department placement coordinators, and peer mentors access profiles simultaneously, naive PUT operations silently overwrite each other.
3. **Data Integrity & Scalability**: Unbounded queries (`SELECT *`) crash browser tabs and exhaust backend memory. Weak schema validation allows malformed URLs, empty skills, and casing duplicate roll numbers to corrupt records.

FORSEE Nexus was engineered to solve these problems through bounded pooling, optimistic concurrency control, bounded pagination, authoritative boundary validation, and a calm, institutional user experience.

---

## Recruitment Requirements Mapping

This submission fulfills and exceeds all recruitment criteria:

| Requirement | Implementation Detail | Verification & Tests |
| :--- | :--- | :--- |
| **Backend REST Endpoints** (`GET/POST /api/v1/students`, `GET/PUT/DELETE /api/v1/students/{id}`, `GET /health`) | Implemented in `backend/app/api/students.py` and `backend/app/main.py`. Added `GET /ready` database probe. | Verified via `test_health_check`, `test_readiness_check`, CRUD integration tests in `backend/tests/test_students.py`. |
| **Student Data Model** (id, name, roll_number, department, year, avatar_url, skills, linkedin_url, github_url, timestamps) | Declared in `backend/app/models/student.py` with unique index on `roll_number`, composite index on `(department, year)`, and `version` concurrency column. | Schema validated via `test_create_student_success`, Alembic migration `001_initial_student_schema.py`. |
| **Validation & Sanitization** | Pydantic v2 schemas in `backend/app/schemas/student.py`: trimmed strings, uppercase alphanumeric roll numbers, years 1–5, deduplicated non-empty skills, http/https URL enforcement. | Tested in `test_create_student_validation_errors`. |
| **Frontend Profile Card** | Distinctive identity layout in `frontend/src/components/StudentCard.tsx` with high-resolution portrait, academic metadata, skill badges, and social links. | Verified across desktop (1440px), tablet (768px), and mobile (375px). |
| **Edit / Save / Cancel Mode** | Two-way editable form in `frontend/src/components/StudentForm.tsx` with live avatar preview, interactive skill tag manager, and draft cancellation. | Tested in browser and verified through state transitions. |
| **Profile Completeness** | Truthful 6-field completeness calculation in `frontend/src/components/CompletenessIndicator.tsx` with an expandable missing-fields checklist. | Tested with complete (100%) and partial student records. |
| **Loading & Error States** | Explicit UI states for loading spinners, save progress, network unavailability, 404 student not found, and validation banners. | Handled in `frontend/src/App.tsx`. |
| **Delete Safety** | Explicit modal dialog in `frontend/src/components/DeleteConfirmModal.tsx` requiring deliberate confirmation showing the student's name and irreversible notice. | Verified interactive confirmation flow. |

---

## Architecture

The system follows a strict **Layered Architecture**:

```
[ Browser / Client ]
        │  HTTP / JSON (with X-Request-ID)
        ▼
[ FastAPI Router ] (backend/app/api/students.py)
   ├── Middleware: X-Request-ID, Latency Timer, Security Headers
   └── OpenAPI & Query Parameters (q, department, year, skip, limit)
        │
        ▼
[ Pydantic Schemas ] (backend/app/schemas/student.py)
   └── Strict boundary sanitization & URL validation
        │
        ▼
[ Service Layer ] (backend/app/services/student.py)
   ├── Uniqueness checks (roll_number)
   ├── Optimistic Concurrency Control (version validation)
   └── Bounded pagination bounds enforcement (limit <= 100)
        │
        ▼
[ Repository Layer ] (backend/app/repositories/student.py)
   └── SQLAlchemy 2.0 select queries with filters & sorting
        │
        ▼
[ Database Layer ] (backend/app/db/database.py)
   └── Bounded Connection Pool (DB_POOL_SIZE, DB_MAX_OVERFLOW)
        │
        ▼
[ Relational Storage ] (SQLite local / PostgreSQL production)
```

---

## Production Architecture

We explicitly distinguish **Local Development** from **Intended Production Deployment**:

### Local Development Topology
- **Web Server**: Single Uvicorn process running on localhost (`127.0.0.1:8000`).
- **Database**: Zero-dependency SQLite file (`forsee_nexus.db`) with `StaticPool` or single-process thread isolation.
- **Frontend**: Vite dev server (`127.0.0.1:5173`) proxying requests to the backend.

### Intended Production Deployment Topology

```
                         [ Internet Traffic ]
                                  │
                                  ▼
                 [ Cloudflare / Edge CDN & DDoS Shield ]
                                  │
                                  ▼
             [ Reverse Proxy / Load Balancer (Nginx / ALB) ]
             ├── SSL Termination (TLS 1.3)
             ├── Rate Limiting (Token Bucket)
             └── Request Correlation ID Injection
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
        [ FastAPI Instance 1 ]      [ FastAPI Instance 2 ]
        (Gunicorn + 4 Uvicorn workers)  (Gunicorn + 4 Uvicorn workers)
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                     [ PostgreSQL Database Cluster ]
                     ├── Bounded Connection Pool (20–30 sockets)
                     ├── Multi-Version Concurrency Control (MVCC)
                     ├── B-Tree Indexes (roll_number, dept+year)
                     └── Streaming Replica / Automated Backups
```

### Concurrency Principle: 1,000 HTTP Users ≠ 1,000 DB Connections
In a production deployment serving 1,000 concurrent HTTP users:
1. HTTP concurrency is absorbed by the asynchronous ASGI event loops and worker processes across application nodes.
2. Read and write profile operations execute in **1–5 milliseconds**.
3. A bounded connection pool of **20 connections + 10 overflow** can comfortably process hundreds of transactions per second without exhausting database memory or triggering thread context-switching thrashing.

---

## Database

### Schema Definition
```sql
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    avatar_url VARCHAR(500),
    skills JSON,
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    version INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE UNIQUE INDEX ix_students_roll_number ON students (roll_number);
CREATE INDEX ix_students_department ON students (department);
CREATE INDEX ix_students_year ON students (year);
CREATE INDEX ix_students_department_year ON students (department, year);
```

### Skills Storage Strategy
Skills are stored as a JSON array (`sa.JSON`). For a college scale of 6,000 students where skills are only retrieved and updated with a student's own profile, JSON storage avoids complex many-to-many join overhead while maintaining zero-maintenance simplicity.

### Migrations with Alembic
Schema evolution is managed via Alembic:
```powershell
# Run pending migrations to head
& .\backend\.venv\Scripts\alembic.exe -c backend/alembic.ini upgrade head

# Check current revision
& .\backend\.venv\Scripts\alembic.exe -c backend/alembic.ini current
```

---

## API Specification

All routes are prefixed under `/api/v1` except root health/readiness probes:

| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | `200` | Lightweight process liveness probe. |
| `GET` | `/ready` | `200` / `503` | Readiness probe executing a lightweight `SELECT 1` on the database. |
| `GET` | `/api/v1/students` | `200` | List students with `q` search, `department`, `year`, `skip`, and bounded `limit` (max 100). |
| `POST` | `/api/v1/students` | `201` | Create new student record with strict validation. |
| `GET` | `/api/v1/students/{id}` | `200` | Retrieve single student by ID. |
| `PUT` | `/api/v1/students/{id}` | `200` / `409` | Update student profile with optimistic concurrency version check. |
| `DELETE` | `/api/v1/students/{id}` | `204` | Permanently remove student record. |

### Pagination Response Headers
When listing students, pagination metadata is supplied via authoritative HTTP response headers:
- `X-Total-Count`: Total number of matching records (e.g., `6000`).
- `X-Page-Limit`: Maximum records returned in the current slice (e.g., `100`).
- `X-Page-Skip`: Current offset applied (e.g., `0`).

---

## Validation & Normalization

All inputs are validated at the FastAPI/Pydantic API boundary:
- **Name**: 2 to 100 characters, whitespace stripped, reject blank strings.
- **Roll Number**: 2 to 50 characters, normalized to uppercase alphanumeric (e.g., `2024CS0142`).
- **Department**: Standardized academic department string.
- **Academic Year**: Bounded integer between `1` and `5`.
- **Skills**: Cleaned list with whitespace trimmed, empty strings eliminated, and duplicate items deduplicated.
- **External URLs**: Validated against `http://` and `https://` schemes. Relative or malformed strings are rejected with HTTP 422.

---

## Error Handling

Error responses follow a predictable structure:
```json
{
  "detail": "Descriptive, human-readable error message."
}
```

- **400 Bad Request**: Malformed or unprocessable client parameters.
- **404 Not Found**: Resource with given ID does not exist.
- **409 Conflict**: Duplicate roll number OR stale version update conflict.
- **422 Unprocessable Entity**: Pydantic schema validation failures with precise field paths.
- **500 Internal Server Error**: Unexpected errors logged internally with Request ID; never leaks stack traces or SQL strings to clients.

---

## Concurrency & Lost Update Protection

FORSEE Nexus implements **Optimistic Concurrency Control (OCC)**:
1. Every student entity maintains an integer `version` column (starts at `1`).
2. When the frontend loads a student for editing, it captures the current `version`.
3. When saving changes (`PUT /api/v1/students/{id}`), the payload sends `version`.
4. The service layer verifies that the incoming version matches the database record:
   - **Match**: Update is applied and `version` is incremented (`version + 1`).
   - **Mismatch**: The service aborts the transaction and returns **HTTP 409 Conflict**:
     `"Student record has been modified by another process. Please refresh and retry."`
5. The frontend alerts the user to reload the latest record, preventing silent data overwrites.

---

## Observability & Security

Every HTTP request traverses an observability middleware:
- **`X-Request-ID`**: Client-supplied or server-generated UUIDv4 correlation ID returned in headers and logged on every request.
- **`X-Response-Time-Ms`**: Server processing latency recorded to two decimal places.
- **Structured Logging**: Console logs format `timestamp`, `level`, `method`, `path`, `status`, `duration`, and `req_id`.
- **Security Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## Frontend Design Philosophy: "The Student Constellation"

The user interface rejects generic SaaS tropes in favor of an **institutional digital product**:
- **Subject-First Layout**: The student's identity, academic progress, and technical competence form the visual focal point.
- **Procedural Spatial Backdrop**: A restrained canvas of faint coordinate markings and subtle academic grid nodes that gently shifts with pointer depth. Automatically disabled when `prefers-reduced-motion` is detected.
- **Restrained Institutional Palette**:
  - Deep Navy / Slate background (`#0B0F19`, `#111827`)
  - Crisp typography (`#F8FAFC`, `#94A3B8`)
  - Authoritative Royal Cobalt Blue accent (`#2563EB`)
  - Clean neutral borders (`#1E293B`)
- **Curated Directory Header**: Fast search and department/year filter chips displaying total student records without visual clutter.
- **Truthful Profile Completeness**: Transparently calculates completed information fields (100% = *"All profile fields completed"*) with an interactive missing-field drawer.
- **Performance Optimization**: Production vendor chunk splitting via Vite/Rollup isolates React and icons into cached assets, keeping core application JS under **42 kB**.

---

## Automated Testing & Quality Bar

The test suite covers full integration, schema validation, and concurrency behavior:

```powershell
# Run backend pytest suite (17/17 tests passing)
& .\backend\.venv\Scripts\pytest.exe -v

# Run backend linter and formatter
& .\backend\.venv\Scripts\ruff.exe check backend\app backend\tests
& .\backend\.venv\Scripts\black.exe --check backend\app backend\tests

# Run frontend linter and production build
npm --prefix frontend run lint
npm --prefix frontend run build
```

### Verified Test Cases (17 Total)
1. `test_health_check`: Process liveness probe.
2. `test_readiness_check`: Database connection probe.
3. `test_request_id_and_security_headers`: Request correlation ID and HTTP security headers.
4. `test_create_student_success`: Successful student insertion.
5. `test_create_student_duplicate_roll_number`: Rejection of duplicate roll number (HTTP 409).
6. `test_create_student_validation_errors`: Rejection of invalid years, blank names, bad URLs (HTTP 422).
7. `test_get_student_by_id`: Record retrieval by primary key.
8. `test_get_nonexistent_student`: HTTP 404 for invalid ID.
9. `test_list_students_and_filtering`: Filtering by department and year.
10. `test_pagination_headers_and_bounds`: Validation of `X-Total-Count` headers and max limit enforcement.
11. `test_search_query_filter`: Search filtering by name, roll number, and department.
12. `test_update_student_success`: Record modification.
13. `test_update_student_conflict_roll_number`: Preventing roll number collision during update (HTTP 409).
14. `test_update_nonexistent_student`: HTTP 404 on updating nonexistent ID.
15. `test_optimistic_concurrency_conflict`: Concurrency version conflict rejection (HTTP 409).
16. `test_delete_student_success`: Successful deletion (HTTP 204).
17. `test_delete_nonexistent_student`: HTTP 404 on deleting invalid ID.

---

## Local Setup

### Prerequisites
- Python 3.12+
- Node.js 20+ & npm
- PowerShell (Windows) or bash (macOS/Linux)

### 1. Backend Setup
```powershell
# Navigate to project root
cd c:\PROJECTS\forsee-nexus

# Virtual environment setup
python -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt

# Run migrations
& .\backend\.venv\Scripts\alembic.exe -c backend/alembic.ini upgrade head

# Start API server
& .\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
API endpoints available at: `http://127.0.0.1:8000`  
Swagger documentation available at: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
In a separate terminal:
```powershell
cd c:\PROJECTS\forsee-nexus\frontend
npm install
npm run dev
```
Web application available at: `http://127.0.0.1:5173`

---

## Environment Variables

Configured in `backend/.env` (based on `backend/.env.example`):

| Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `PROJECT_NAME` | `FORSEE Nexus` | API application name |
| `API_V1_STR` | `/api/v1` | Base API routing prefix |
| `DATABASE_URL` | `sqlite:///./forsee_nexus.db` | Database connection string (PostgreSQL in prod) |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:5173","http://127.0.0.1:5173"]` | Allowed CORS origins (must not be `*` in prod) |
| `DB_POOL_SIZE` | `20` | Bounded connection pool size |
| `DB_MAX_OVERFLOW` | `10` | Maximum surge connections |
| `DB_POOL_TIMEOUT` | `30` | Seconds to wait before timing out connection acquisition |
| `DB_POOL_RECYCLE` | `1800` | Sockets recycled after 30 minutes |

---

## Limitations

To remain honest and avoid marketing hype:
1. **Local Concurrency Bound**: When running on local SQLite, write concurrency is limited by SQLite's file-level locking. High concurrent write throughput requires deploying to PostgreSQL.
2. **Search Implementation**: Search currently performs indexed case-insensitive SQL matching across name, roll number, and department. Full-text search (PostgreSQL `tsvector` or Elasticsearch) is not implemented for the 6,000-student scope.
3. **No Authentication Layer**: The current recruitment scope intentionally omits authentication (JWT/OAuth2). In production, an institutional Single Sign-On (SSO) gateway must protect mutation endpoints.

---

## Future Scope

1. **Institutional SSO Integration**: SAML 2.0 / OAuth2 integration with university identity providers.
2. **Bulk Roster Import**: CSV/Excel batch ingestion with background worker validation.
3. **Automated Audit Logs**: Historical timeline tracking profile edits by timestamp and user identity.
4. **PostgreSQL Read Replicas**: Directing directory queries to read replicas while writes route to the primary instance.
