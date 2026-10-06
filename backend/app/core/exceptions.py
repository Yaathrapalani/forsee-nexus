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


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Log exception internally, don't leak raw stack traces to the client
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please try again later."
        },
    )
