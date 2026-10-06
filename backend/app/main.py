import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.api.students import router as students_router
from app.core.config import settings
from app.core.exceptions import (
    DuplicateRollNumberError,
    StudentNotFoundError,
    StudentValidationError,
    duplicate_roll_number_handler,
    student_not_found_handler,
    student_validation_handler,
)
from app.db.database import Base, SessionLocal, engine
from app.models.student import Student

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("forsee-nexus")


def seed_initial_data() -> None:
    """Seed initial sample student for demo and recruitment inspection if DB is empty."""
    db = SessionLocal()
    try:
        count = db.query(Student).count()
        if count == 0:
            logger.info("Database is empty. Seeding initial student profile...")
            sample_student = Student(
                name="Aarav Sharma",
                roll_number="2024CS0142",
                department="Computer Science & Engineering",
                year=3,
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
                skills=[
                    "React",
                    "TypeScript",
                    "FastAPI",
                    "Python",
                    "SQLAlchemy",
                    "Tailwind CSS",
                    "Git",
                ],
                linkedin_url="https://linkedin.com/in/aarav-sharma-nexus",
                github_url="https://github.com/aarav-nexus",
            )
            db.add(sample_student)
            db.commit()
            logger.info(
                "Successfully seeded initial student: %s (ID: %s)",
                sample_student.name,
                sample_student.id,
            )
    except Exception as e:
        logger.warning("Could not run initial seed: %s", e)
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed demo record
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    yield
    # Shutdown logic (if any)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
app.add_exception_handler(StudentNotFoundError, student_not_found_handler)
app.add_exception_handler(DuplicateRollNumberError, duplicate_roll_number_handler)
app.add_exception_handler(StudentValidationError, student_validation_handler)

# Include Routers
app.include_router(students_router, prefix=settings.API_V1_STR)


@app.get(
    "/health",
    tags=["System"],
    status_code=status.HTTP_200_OK,
    summary="Health check endpoint",
)
def health_check():
    return {
        "status": "healthy",
        "service": "forsee-nexus-api",
        "version": settings.VERSION,
    }


@app.get("/", tags=["System"], include_in_schema=False)
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_url": "/health",
        "api_v1": f"{settings.API_V1_STR}/students",
    }
