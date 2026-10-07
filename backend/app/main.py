import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.students import router as students_router
from app.core.config import settings
from app.core.exceptions import (
    ConcurrencyConflictError,
    DuplicateRollNumberError,
    StudentNotFoundError,
    StudentValidationError,
    concurrency_conflict_handler,
    duplicate_roll_number_handler,
    generic_exception_handler,
    student_not_found_handler,
    student_validation_handler,
)
from app.db.database import Base, SessionLocal, engine
from app.db.seed_data import SAMPLE_STUDENTS
from app.models.student import Student

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("forsee-nexus")


def seed_initial_data() -> None:
    """Seed sample students for recruitment inspection if DB has fewer than 12 records."""
    db = SessionLocal()
    try:
        count = db.query(Student).count()
        if count < len(SAMPLE_STUDENTS):
            logger.info(
                "Syncing sample student cohort (%s existing, %s target)...",
                count,
                len(SAMPLE_STUDENTS),
            )
            created = 0
            for item in SAMPLE_STUDENTS:
                existing = (
                    db.query(Student)
                    .filter(Student.roll_number == item["roll_number"])
                    .first()
                )
                if not existing:
                    student = Student(**item)
                    db.add(student)
                    created += 1
            db.commit()
            logger.info(
                "Successfully seeded %s new students. Total in DB: %s",
                created,
                db.query(Student).count(),
            )
    except Exception as e:
        logger.warning("Could not run initial seed: %s", e)
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed demo record if needed
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    yield
    # Shutdown logic
    engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# Observability, Request Correlation, and Security Middleware
@app.middleware("http")
async def observability_and_security_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.perf_counter()

    response = await call_next(request)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # Attach correlation & security headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-Ms"] = str(duration_ms)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    logger.info(
        "%s %s -> status=%d duration=%.2fms req_id=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        request_id,
    )
    return response


# CORS Middleware with configurable origins
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Total-Count", "X-Page-Limit", "X-Page-Skip"],
)

# Exception Handlers
app.add_exception_handler(StudentNotFoundError, student_not_found_handler)
app.add_exception_handler(DuplicateRollNumberError, duplicate_roll_number_handler)
app.add_exception_handler(StudentValidationError, student_validation_handler)
app.add_exception_handler(ConcurrencyConflictError, concurrency_conflict_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include Routers
app.include_router(students_router, prefix=settings.API_V1_STR)


@app.get(
    "/health",
    tags=["System"],
    status_code=status.HTTP_200_OK,
    summary="Liveness probe endpoint",
    description="Fast non-blocking check confirming process health.",
)
def health_check():
    return {
        "status": "healthy",
        "service": "forsee-nexus-api",
        "version": settings.VERSION,
    }


@app.get(
    "/ready",
    tags=["System"],
    summary="Readiness probe verifying dependency connectivity",
    description="Validates database connection health to determine if process is ready to receive traffic.",
)
def readiness_check(response: Response):
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
        return {
            "status": "ready",
            "database": "connected",
            "service": "forsee-nexus-api",
            "version": settings.VERSION,
        }
    except Exception as e:
        logger.error("Readiness check database error: %s", e)
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "not_ready",
            "detail": "Database connection unavailable",
            "service": "forsee-nexus-api",
        }


@app.get("/", tags=["System"], include_in_schema=False)
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_url": "/health",
        "ready_url": "/ready",
        "api_v1": f"{settings.API_V1_STR}/students",
    }
