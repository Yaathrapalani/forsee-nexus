"""Initial student schema with indexes and concurrency version

Revision ID: 001_initial
Revises:
Create Date: 2026-10-07 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("roll_number", sa.String(length=50), nullable=False),
        sa.Column("department", sa.String(length=100), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("skills", sa.JSON(), nullable=True),
        sa.Column("linkedin_url", sa.String(length=500), nullable=True),
        sa.Column("github_url", sa.String(length=500), nullable=True),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_students_id", "students", ["id"], unique=False)
    op.create_index("ix_students_roll_number", "students", ["roll_number"], unique=True)
    op.create_index("ix_students_department", "students", ["department"], unique=False)
    op.create_index("ix_students_year", "students", ["year"], unique=False)
    op.create_index(
        "ix_students_department_year",
        "students",
        ["department", "year"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_students_department_year", table_name="students")
    op.drop_index("ix_students_year", table_name="students")
    op.drop_index("ix_students_department", table_name="students")
    op.drop_index("ix_students_roll_number", table_name="students")
    op.drop_index("ix_students_id", table_name="students")
    op.drop_table("students")
