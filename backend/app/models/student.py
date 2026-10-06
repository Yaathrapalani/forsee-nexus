from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, Integer, String

from app.db.database import Base


class Student(Base):
    """
    SQLAlchemy ORM model for Student records.
    Contains mandatory core academic fields and extended profile fields
    for the FORESE Student Profile card.
    """

    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    roll_number = Column(String(50), unique=True, index=True, nullable=False)
    department = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    skills = Column(JSON, nullable=True, default=list)
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Student(id={self.id}, roll_number='{self.roll_number}', name='{self.name}')>"
