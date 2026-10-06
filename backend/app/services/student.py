from sqlalchemy.orm import Session

from app.core.exceptions import (
    ConcurrencyConflictError,
    DuplicateRollNumberError,
    StudentNotFoundError,
)
from app.models.student import Student
from app.repositories.student import StudentRepository
from app.schemas.student import StudentCreate, StudentUpdate


class StudentService:
    """
    Business logic layer for student lifecycle management.
    Enforces uniqueness, concurrency version checking, and college-scale pagination bounds.
    """

    def __init__(self, repository: StudentRepository | None = None):
        self.repository = repository or StudentRepository()

    def get_student(self, db: Session, student_id: int) -> Student:
        student = self.repository.get_by_id(db, student_id)
        if not student:
            raise StudentNotFoundError(student_id)
        return student

    def count_students(
        self,
        db: Session,
        department: str | None = None,
        year: int | None = None,
        q: str | None = None,
    ) -> int:
        return self.repository.count(db, department=department, year=year, q=q)

    def list_students(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 50,
        department: str | None = None,
        year: int | None = None,
        q: str | None = None,
    ) -> list[Student]:
        bounded_limit = min(max(limit, 1), 100)
        return self.repository.list(
            db,
            skip=skip,
            limit=bounded_limit,
            department=department,
            year=year,
            q=q,
        )

    def create_student(self, db: Session, student_in: StudentCreate) -> Student:
        existing = self.repository.get_by_roll_number(db, student_in.roll_number)
        if existing:
            raise DuplicateRollNumberError(student_in.roll_number)

        student_data = student_in.model_dump()
        student = Student(**student_data)
        return self.repository.create(db, student)

    def update_student(
        self, db: Session, student_id: int, student_in: StudentUpdate
    ) -> Student:
        student = self.get_student(db, student_id)

        # Optimistic concurrency check (Lost Update Protection)
        if student_in.version is not None and student_in.version != student.version:
            raise ConcurrencyConflictError(
                expected_version=student_in.version,
                current_version=student.version,
            )

        update_data = student_in.model_dump(exclude_unset=True)

        # If roll_number is being changed, verify uniqueness
        if (
            "roll_number" in update_data
            and update_data["roll_number"] != student.roll_number
        ):
            conflict = self.repository.get_by_roll_number(
                db, update_data["roll_number"]
            )
            if conflict and conflict.id != student_id:
                raise DuplicateRollNumberError(update_data["roll_number"])

        # Advance concurrency version on every successful update
        update_data["version"] = (student.version or 1) + 1

        return self.repository.update(db, student, update_data)

    def delete_student(self, db: Session, student_id: int) -> None:
        student = self.get_student(db, student_id)
        self.repository.delete(db, student)
