import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _sanitize_string(v: str | None, field_label: str) -> str | None:
    if v is None:
        return None
    v = v.strip()
    if not v:
        raise ValueError(f"{field_label} cannot be empty or contain only whitespace.")
    return v


def _sanitize_roll_number(v: str | None) -> str | None:
    if v is None:
        return None
    v = v.strip().upper()
    if not v:
        raise ValueError("Roll number cannot be empty.")
    if not re.match(r"^[A-Z0-9_\-\/]+$", v):
        raise ValueError(
            "Roll number must contain only alphanumeric characters, hyphens, underscores, or slashes."
        )
    return v


def _sanitize_skills(v: list[str] | None) -> list[str] | None:
    if v is None:
        return None
    cleaned: list[str] = []
    for skill in v:
        if isinstance(skill, str):
            trimmed = skill.strip()
            if trimmed and trimmed not in cleaned:
                cleaned.append(trimmed)
    return cleaned


def _sanitize_avatar_url(v: str | None) -> str | None:
    if v is None:
        return None
    v = v.strip()
    if not v:
        return None
    if not v.startswith(("http://", "https://", "/")):
        raise ValueError("Avatar URL must start with http://, https://, or /")
    return v


def _sanitize_external_url(v: str | None, platform_name: str) -> str | None:
    if v is None:
        return None
    v = v.strip()
    if not v:
        return None
    if not v.startswith(("http://", "https://")):
        raise ValueError(f"{platform_name} URL must start with http:// or https://")
    return v


class StudentBase(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=100, description="Full name of the student"
    )
    roll_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Unique college roll or registration number",
    )
    department: str = Field(
        ..., min_length=1, max_length=100, description="Academic department"
    )
    year: int = Field(..., ge=1, le=5, description="Academic year (1 to 5)")
    avatar_url: str | None = Field(
        None, max_length=500, description="Optional photo URL"
    )
    skills: list[str] = Field(
        default_factory=list, description="List of technical skills"
    )
    linkedin_url: str | None = Field(
        None, max_length=500, description="LinkedIn profile URL"
    )
    github_url: str | None = Field(
        None, max_length=500, description="GitHub profile URL"
    )

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, v: str) -> str:
        res = _sanitize_string(v, "Student name")
        if not res:
            raise ValueError("Student name cannot be empty.")
        return res

    @field_validator("department", mode="before")
    @classmethod
    def validate_department(cls, v: str) -> str:
        res = _sanitize_string(v, "Department")
        if not res:
            raise ValueError("Department cannot be empty.")
        return res

    @field_validator("roll_number", mode="before")
    @classmethod
    def validate_roll(cls, v: str) -> str:
        res = _sanitize_roll_number(v)
        if not res:
            raise ValueError("Roll number cannot be empty.")
        return res

    @field_validator("skills", mode="before")
    @classmethod
    def validate_skills(cls, v: list[str] | None) -> list[str]:
        cleaned = _sanitize_skills(v)
        return cleaned if cleaned is not None else []

    @field_validator("avatar_url", mode="before")
    @classmethod
    def validate_avatar(cls, v: str | None) -> str | None:
        return _sanitize_avatar_url(v)

    @field_validator("linkedin_url", mode="before")
    @classmethod
    def validate_linkedin(cls, v: str | None) -> str | None:
        return _sanitize_external_url(v, "LinkedIn")

    @field_validator("github_url", mode="before")
    @classmethod
    def validate_github(cls, v: str | None) -> str | None:
        return _sanitize_external_url(v, "GitHub")


class StudentCreate(StudentBase):
    """Schema for creating a new student record."""

    pass


class StudentUpdate(BaseModel):
    """Schema for updating an existing student record."""

    name: str | None = Field(None, min_length=1, max_length=100)
    roll_number: str | None = Field(None, min_length=1, max_length=50)
    department: str | None = Field(None, min_length=1, max_length=100)
    year: int | None = Field(None, ge=1, le=5)
    avatar_url: str | None = Field(None, max_length=500)
    skills: list[str] | None = Field(None)
    linkedin_url: str | None = Field(None, max_length=500)
    github_url: str | None = Field(None, max_length=500)
    version: int | None = Field(
        None, ge=1, description="Expected version for optimistic concurrency control"
    )

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        return _sanitize_string(v, "Student name")

    @field_validator("department", mode="before")
    @classmethod
    def validate_department(cls, v: str | None) -> str | None:
        return _sanitize_string(v, "Department")

    @field_validator("roll_number", mode="before")
    @classmethod
    def validate_roll(cls, v: str | None) -> str | None:
        return _sanitize_roll_number(v)

    @field_validator("skills", mode="before")
    @classmethod
    def validate_skills(cls, v: list[str] | None) -> list[str] | None:
        return _sanitize_skills(v)

    @field_validator("avatar_url", mode="before")
    @classmethod
    def validate_avatar(cls, v: str | None) -> str | None:
        return _sanitize_avatar_url(v)

    @field_validator("linkedin_url", mode="before")
    @classmethod
    def validate_linkedin(cls, v: str | None) -> str | None:
        return _sanitize_external_url(v, "LinkedIn")

    @field_validator("github_url", mode="before")
    @classmethod
    def validate_github(cls, v: str | None) -> str | None:
        return _sanitize_external_url(v, "GitHub")


class StudentResponse(StudentBase):
    """Schema returned to API clients."""

    id: int
    version: int = Field(1, description="Record concurrency version")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
