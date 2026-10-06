from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.student import Student


class StudentRepository:
    """
    Data-access layer for Student records using SQLAlchemy 2.x patterns.
    """

    def get_by_id(self, db: Session, student_id: int) -> Student | None:
        statement = select(Student).where(Student.id == student_id)
        return db.execute(statement).scalars().first()

    def get_by_roll_number(self, db: Session, roll_number: str) -> Student | None:
        statement = select(Student).where(Student.roll_number == roll_number)
        return db.execute(statement).scalars().first()

    def list(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        department: str | None = None,
        year: int | None = None,
    ) -> list[Student]:
        statement = select(Student)
        if department:
            statement = statement.where(Student.department == department)
        if year is not None:
            statement = statement.where(Student.year == year)
        statement = statement.order_by(Student.id.desc()).offset(skip).limit(limit)
        return list(db.execute(statement).scalars().all())

    def create(self, db: Session, student: Student) -> Student:
        db.add(student)
        db.commit()
        db.refresh(student)
        return student

    def update(self, db: Session, student: Student, update_data: dict) -> Student:
        for field, value in update_data.items():
            setattr(student, field, value)
        db.commit()
        db.refresh(student)
        return student

    def delete(self, db: Session, student: Student) -> None:
        db.delete(student)
        db.commit()
