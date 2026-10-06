# Architecture Decision Records (ADRs)

Project: **FORSEE Nexus — Student Profile System**  
Status: Accepted / Production-Minded College-Scale Baseline  

---

## ADR-001: Why FastAPI

### Context
The backend service must provide high-performance REST APIs for student profile management, handle structured JSON serialization, enforce rigorous schema validation, support dependency injection, and integrate seamlessly with modern Python observability tooling.

### Decision
We chose **FastAPI** running on Uvicorn (ASGI) using standard Python type annotations and Pydantic v2.

### Consequences & Trade-offs
- **Advantages**:
  - Automatic OpenAPI / Swagger interactive documentation (`/docs`, `/redoc`).
  - High raw throughput with asynchronous event loop while allowing threadpool offloading (`starlette.concurrency.run_in_threadpool`) for blocking database sessions.
  - Native validation through Pydantic v2 with clear, predictable HTTP 422 error structures.
  - Composable dependency injection (`Depends`) for transactional database sessions and service layers.
- **Trade-offs**:
  - Requires disciplined separation between synchronous I/O operations and async request handling to prevent event loop blocking.

---

## ADR-002: Why SQLite Locally

### Context
Recruitment evaluation and local developer workflows require a friction-free onboarding experience. Reviewers should be able to clone the repository and run backend tests or start the API immediately without installing, running, and configuring an external relational database service or Docker daemon.

### Decision
Use **SQLite** as the default local database engine via `DATABASE_URL=sqlite:///./forsee_nexus.db`.

### Consequences & Trade-offs
- **Advantages**:
  - Zero external dependencies: works out of the box on Windows, macOS, and Linux.
  - Instant test execution (17 tests execute in < 0.7 seconds with in-memory or file-backed SQLite).
  - Single-file storage simplifies debugging, backup inspections, and reproducible evaluation.
- **Trade-offs**:
  - SQLite uses file-level locking for writes and does not support true concurrent writer scaling or production PostgreSQL features (such as `RETURNING` across all dialects or fine-grained row-level locking).
  - Production deployments must switch to PostgreSQL via environment variables.

---

## ADR-003: Why PostgreSQL in Production

### Context
In an institutional college deployment serving ~6,000 students and approximately 100–300 normal concurrent users (peaking at ~1,000 concurrent HTTP requests during registration or campus placement drives), multiple stateless backend instances run behind a reverse proxy/load balancer.

### Decision
Target **PostgreSQL** as the authoritative production relational database, configured through the `DATABASE_URL` environment variable (e.g., `postgresql+psycopg2://...` or `postgresql+asyncpg://...`).

### Consequences & Trade-offs
- **Advantages**:
  - ACID guarantees under concurrent write traffic from multiple FastAPI instances.
  - Multi-Version Concurrency Control (MVCC) prevents read-write contention.
  - Robust indexing support (B-tree on `roll_number`, composite indexes on `(department, year)`).
  - Industry-standard tooling for physical and logical backups, point-in-time recovery, and connection pooling (PgBouncer).
- **Trade-offs**:
  - Requires dedicated server provisioning, database connection tuning, credentials management, and migration governance.

---

## ADR-004: Why Layered Architecture

### Context
Mixing HTTP routing, validation, business logic, transaction lifecycles, and direct SQL queries inside single route handlers creates tight coupling, degrades testability, and leads to maintenance bugs as the application grows.

### Decision
Implement a strict **Layered Architecture** with distinct responsibilities:
1. **API Router Layer** (`backend/app/api/`): HTTP parsing, query parameters, status codes, response headers.
2. **Service Layer** (`backend/app/services/`): Business logic, domain rules, uniqueness checks, version conflict detection.
3. **Repository Layer** (`backend/app/repositories/`): Data access, SQLAlchemy queries, sorting, pagination, transaction execution.
4. **Data Models / Schemas** (`backend/app/models/` & `backend/app/schemas/`): SQLAlchemy ORM entities and Pydantic validation contracts.

### Consequences & Trade-offs
- **Advantages**:
  - Highly testable: services and repositories can be tested independently or mocked if desired.
  - Clear separation of concerns: database queries never leak into presentation code.
  - Swappable storage implementations without touching business rules.
- **Trade-offs**:
  - Requires slightly more boilerplate (service classes and repository methods) compared to simple CRUD scripts.

---

## ADR-005: Why Bounded Pagination & Metadata Headers

### Context
Unbounded queries (e.g., `SELECT * FROM students`) fail disastrously at college scale (6,000 students). Returning thousands of full records consumes massive server memory, saturates network bandwidth, blocks worker threads, and crashes client browsers.

### Decision
Enforce strict **bounded pagination** on `GET /api/v1/students`:
- Default limit: `100` items (safe for student directory browsing).
- Hard maximum: `limit <= 100` enforced at the schema/query level (rejecting or capping abusive requests like `limit=1000000`).
- Offset pagination via `skip` and `limit`.
- Expose pagination metadata via standard HTTP response headers (`X-Total-Count`, `X-Page-Limit`, `X-Page-Skip`).

### Consequences & Trade-offs
- **Advantages**:
  - Preserves exact backwards compatibility with the recruitment requirement contract (which expects a JSON array of student objects).
  - Predictable memory footprint: the API never serializes more than 100 records per request.
  - Allows frontends and mobile clients to build pagination or infinite scrolling with authoritative count headers.
- **Trade-offs**:
  - Extremely large offsets (`skip > 10,000`) in SQL offset pagination incur query performance degradation; for 6,000 records, offset pagination is optimal and eliminates complexity compared to keyset pagination.

---

## ADR-006: Why Bounded Connection Pooling

### Context
During peak traffic (e.g., campus placement registration or semester results), 1,000 concurrent HTTP clients may connect simultaneously. Opening 1,000 persistent PostgreSQL connections exhausts database RAM, incurs OS thread-switching overhead, and risks server crashes.

### Decision
Enforce **bounded connection pooling** at the SQLAlchemy engine layer:
- `DB_POOL_SIZE = 20`
- `DB_MAX_OVERFLOW = 10`
- `DB_POOL_TIMEOUT = 30` seconds
- `DB_POOL_RECYCLE = 1800` seconds (30 minutes)

### Technical Principle: Concurrency != Database Connections
HTTP concurrency is handled by asynchronous application event loops and worker processes (Uvicorn / Gunicorn). Database concurrency is strictly bounded by the connection pool. Because individual student profile queries execute in single-digit milliseconds (1–5ms), a pool of 20–30 database connections comfortably satisfies hundreds of requests per second without overwhelming the database.

### Consequences & Trade-offs
- **Advantages**:
  - Protects the database from connection exhaustion and memory spikes.
  - Automatically recycles stale or severed database sockets.
- **Trade-offs**:
  - Requests must wait up to `DB_POOL_TIMEOUT` if all pool connections are occupied before failing cleanly with a timeout rather than collapsing the database.

---

## ADR-007: Why Optimistic Concurrency Protection (Version Column)

### Context
In college administrative systems, multiple users (e.g., the student and a department coordinator, or two administrators) may open and edit the same student profile simultaneously. Without concurrency controls, the last writer silently overwrites the previous writer's changes (the "lost update" problem).

### Decision
Implement **Optimistic Concurrency Control (OCC)** using a dedicated integer `version` column:
- Every student record initializes with `version = 1`.
- On profile update (`PUT /api/v1/students/{id}`), the client passes the current `version`.
- The service verifies that the incoming version matches the database version.
- If versions match, the update proceeds and the version increments by 1 (`version + 1`).
- If versions differ, the service aborts the transaction and returns **HTTP 409 Conflict** with an informative message (`Student record has been modified by another process. Please refresh and retry.`).

### Consequences & Trade-offs
- **Advantages**:
  - No database locks are held while a user has a form open in their browser.
  - Complete protection against lost updates.
  - Clean, standard REST conflict semantics.
- **Trade-offs**:
  - Frontend clients must track and supply the entity version when performing updates.

---

## ADR-008: Why Honest Profile Completeness Calculation

### Context
Many student platforms use arbitrary or deceptive badges such as "100% Placement Ready", "AI Verified", or "Nexus Certified". These claims mislead students and recruiters about actual administrative verification and employability.

### Decision
Implement an objective, transparent **Profile Completeness** metric based purely on actual profile information fields:
- 6 concrete fields evaluated: Name, Roll Number, Department, Academic Year, Skills (>= 1), and at least one Professional Link (LinkedIn or GitHub).
- The completion score reflects exact data completeness (0% to 100%).
- At 100%, the UI displays: *"All profile fields completed"*.
- The UI provides an interactive checklist showing exactly which fields are complete and which remain missing.

### Consequences & Trade-offs
- **Advantages**:
  - Truthful, institutional tone aligned with academic integrity.
  - Clear, actionable guidance for students completing their profile.
- **Trade-offs**:
  - Does not evaluate subjective resume quality or external verification.

---

## ADR-009: Why Restrained "Student Constellation" Visual Design

### Context
Generic AI dashboard templates with glowing purple-cyan neon gradients, dark glassmorphism cards, and floating particle fields look dated, unprofessional, and out of place in a credible collegiate institution.

### Decision
Adopt the **"Student Constellation"** design philosophy:
- **Visual Subject**: The student's identity (portrait, typography, academic metadata) is the clean visual focal point.
- **Procedural Spatial Backdrop**: Minimalist, low-contrast coordinate markings and an academic grid that react subtly to mouse movement without distracting from text readability.
- **Color Palette**: Deep slate navy (`#0B0F19`), crisp off-white (`#F8FAFC`), cool neutral borders (`#1E293B`), and a single authoritative cobalt blue accent (`#2563EB`).
- **Typography**: Clean, geometric sans-serif hierarchy where labels are understated and student identity is prominent.
- **Accessibility & Performance**: Full support for `prefers-reduced-motion`, semantic HTML, accessible color contrast ratios, and chunked bundle splitting.

### Consequences & Trade-offs
- **Advantages**:
  - High editorial quality resembling a premier university annual report or institutional research registry.
  - Calm, focused, and instantly distinct from template SaaS dashboards.
- **Trade-offs**:
  - Eschews flashy decorative animations in favor of functional, purpose-driven micro-interactions.
