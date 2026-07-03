"""
app/utils/response.py
Standardized API response helpers.
All endpoints return either success_response() or error_response()
to maintain a consistent JSON envelope structure.
"""
from typing import Any, List, Optional

from fastapi.responses import JSONResponse


def success_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = 200,
) -> JSONResponse:
    """Return a standardized success JSON response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
            "data": data,
        },
    )


def error_response(
    message: str = "An error occurred",
    errors: Optional[List[Any]] = None,
    status_code: int = 400,
) -> JSONResponse:
    """Return a standardized error JSON response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "errors": errors or [],
        },
    )
