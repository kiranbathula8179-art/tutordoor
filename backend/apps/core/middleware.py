import logging
import time
import uuid

logger = logging.getLogger("tutordoor")


class RequestLoggingMiddleware:
    """Attaches a request ID and logs method/path/status/duration for every request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = str(uuid.uuid4())
        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = (time.monotonic() - start) * 1000
        response["X-Request-ID"] = request.request_id
        logger.info(
            "%s %s -> %s (%.2fms) [%s]",
            request.method,
            request.get_full_path(),
            response.status_code,
            duration_ms,
            request.request_id,
        )
        return response


class ExceptionLoggingMiddleware:
    """Ensures unhandled exceptions are logged with request context before propagating."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        logger.error(
            "Unhandled exception on %s %s [%s]",
            request.method,
            request.get_full_path(),
            getattr(request, "request_id", "unknown"),
            exc_info=exception,
        )
        return None
