from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.student import StudentCreate, StudentResponse, StudentUpdate
from app.services.student import StudentService

router = APIRouter(prefix="/students", tags=["Students"])

service = StudentService()


@router.get(
    "",
    response_model=list[StudentResponse],
    status_code=status.HTTP_200_OK,
    summary="List all student records",
    description="Retrieve student records with optional department, year filtering and pagination.",
)
def list_students(
    department: str | None = Query(
        None,
        description="Filter students by department (e.g. 'Computer Science & Engineering')",
    ),
    year: int | None = Query(
        None, ge=1, le=5, description="Filter students by academic year (1-5)"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        50, ge=1, le=100, description="Maximum number of records to return"
    ),
    db: Session = Depends(get_db),
) -> list[StudentResponse]:
    return service.list_students(
        db=db, skip=skip, limit=limit, department=department, year=year
    )


@router.post(
    "",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new student record",
    description="Add a new student profile to FORSEE Nexus with validation and duplicate roll number protection.",
)
def create_student(
    student_in: StudentCreate,
    db: Session = Depends(get_db),
) -> StudentResponse:
    return service.create_student(db=db, student_in=student_in)


@router.get(
    "/{student_id}",
    response_model=StudentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get student by ID",
    description="Fetch complete details for a single student by their unique database ID.",
)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
) -> StudentResponse:
    return service.get_student(db=db, student_id=student_id)


@router.put(
    "/{student_id}",
    response_model=StudentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update student details",
    description="Update academic, personal, or skill attributes for an existing student.",
)
def update_student(
    student_id: int,
    student_in: StudentUpdate,
    db: Session = Depends(get_db),
) -> StudentResponse:
    return service.update_student(db=db, student_id=student_id, student_in=student_in)


@router.delete(
    "/{student_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a student record",
    description="Remove a student record permanently by ID.",
)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
) -> Response:
    service.delete_student(db=db, student_id=student_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
