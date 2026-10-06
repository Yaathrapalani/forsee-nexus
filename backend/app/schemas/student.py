import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StudentBase(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=100, description="Full name of the student"
    )
    roll_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Unique college roll / registration number",
    )
    department: str = Field(
        ..., min_length=1, max_length=100, description="Academic department or branch"
    )
    year: int = Field(..., ge=1, le=5, description="Current academic year (1 to 5)")
    avatar_url: str | None = Field(
        None, max_length=500, description="Direct URL to avatar image"
    )
    skills: list[str] = Field(
        default_factory=list, description="List of technical and soft skills"
    )
    linkedin_url: str | None = Field(
        None, max_length=500, description="LinkedIn profile URL"
    )
    github_url: str | None = Field(
        None, max_length=500, description="GitHub profile URL"
    )

    @field_validator("name", "department", mode="before")
    @classmethod
    def validate_non_empty_string(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be empty or contain only whitespace.")
        return v

    @field_validator("roll_number", mode="before")
    @classmethod
    def validate_roll_number(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip().upper()
            if not v:
                raise ValueError("Roll number cannot be empty.")
            if not re.match(r"^[A-Z0-9_\-\/]+$", v):
                raise ValueError(
                    "Roll number must contain only alphanumeric characters, hyphens, underscores, or slashes."
                )
        return v

    @field_validator("skills", mode="before")
    @classmethod
    def clean_skills(cls, v: list[str] | None) -> list[str]:
        if v is None:
            return []
        cleaned: list[str] = []
        for s in v:
            if isinstance(s, str):
                s_strip = s.strip()
                if s_strip and s_strip not in cleaned:
                    cleaned.append(s_strip)
        return cleaned

    @field_validator("avatar_url", "linkedin_url", "github_url", mode="before")
    @classmethod
    def clean_urls(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
            if not v.startswith(("http://", "https://", "/")):
                raise ValueError("URL must start with http://, https://, or /")
        return v


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

    @field_validator("name", "department", mode="before")
    @classmethod
    def validate_non_empty_optional_string(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be empty or contain only whitespace.")
        return v

    @field_validator("roll_number", mode="before")
    @classmethod
    def validate_optional_roll_number(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            v = v.strip().upper()
            if not v:
                raise ValueError("Roll number cannot be empty.")
            if not re.match(r"^[A-Z0-9_\-\/]+$", v):
                raise ValueError(
                    "Roll number must contain only alphanumeric characters, hyphens, underscores, or slashes."
                )
        return v

    @field_validator("skills", mode="before")
    @classmethod
    def clean_optional_skills(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            cleaned: list[str] = []
            for s in v:
                if isinstance(s, str):
                    s_strip = s.strip()
                    if s_strip and s_strip not in cleaned:
                        cleaned.append(s_strip)
            return cleaned
        return v

    @field_validator("avatar_url", "linkedin_url", "github_url", mode="before")
    @classmethod
    def clean_optional_urls(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
            if not v.startswith(("http://", "https://", "/")):
                raise ValueError("URL must start with http://, https://, or /")
        return v


class StudentResponse(StudentBase):
    """Schema returned to API clients."""

    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
