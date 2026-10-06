from fastapi import Request, status
from fastapi.responses import JSONResponse


class StudentNotFoundError(Exception):
    def __init__(self, student_id: int):
        self.student_id = student_id
        super().__init__(f"Student with ID {student_id} not found.")


class DuplicateRollNumberError(Exception):
    def __init__(self, roll_number: str):
        self.roll_number = roll_number
        super().__init__(f"Student with roll number '{roll_number}' already exists.")


class StudentValidationError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class ConcurrencyConflictError(Exception):
    def __init__(self, expected_version: int, current_version: int):
        self.expected_version = expected_version
        self.current_version = current_version
        super().__init__(
            f"Concurrency conflict: record was modified by another transaction "
            f"(expected version {expected_version}, current version {current_version}). "
            f"Please refresh and retry."
        )


async def student_not_found_handler(
    request: Request, exc: StudentNotFoundError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)},
    )


async def duplicate_roll_number_handler(
    request: Request, exc: DuplicateRollNumberError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": str(exc)},
    )


async def student_validation_handler(
    request: Request, exc: StudentValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc)},
    )


async def concurrency_conflict_handler(
    request: Request, exc: ConcurrencyConflictError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": str(exc)},
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Safe error message in client response; full detail logged on server
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please try again later."
        },
    )
