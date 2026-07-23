import logging

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("tutordoor")


class ApplicationError(APIException):
    """Base class for all domain/business-logic errors raised by service layers."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "A business rule was violated."
    default_code = "application_error"


class ResourceNotFoundError(ApplicationError):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "The requested resource was not found."
    default_code = "not_found"


class PermissionDeniedError(ApplicationError):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have permission to perform this action."
    default_code = "permission_denied"


class ConflictError(ApplicationError):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "The request conflicts with the current state of the resource."
    default_code = "conflict"


class PaymentError(ApplicationError):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = "The payment could not be processed."
    default_code = "payment_error"


class RateLimitedError(ApplicationError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "Too many requests. Please try again later."
    default_code = "rate_limited"


def custom_exception_handler(exc, context):
    """
    Wraps every DRF error response into a consistent envelope:
    { "success": false, "code": "...", "message": "...", "errors": {...} }
    """
    response = exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled exception", exc_info=exc)
        return Response(
            {
                "success": False,
                "code": "internal_error",
                "message": "An unexpected error occurred. Our team has been notified.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    code = getattr(exc, "default_code", "error")
    detail = response.data

    message = detail
    errors = None
    if isinstance(detail, dict):
        message = detail.get("detail", "Request failed.")
        errors = {k: v for k, v in detail.items() if k != "detail"} or None
    elif isinstance(detail, list):
        message = detail[0] if detail else "Request failed."
        errors = detail

    response.data = {
        "success": False,
        "code": code,
        "message": message,
        "errors": errors,
    }
    return response
