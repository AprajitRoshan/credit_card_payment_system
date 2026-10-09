import logging
import re
import time

from django.conf import settings

from .models import ApiRequestLog


logger = logging.getLogger("monitoring")

NUMERIC_SEGMENT = re.compile(r"/\d+(?=/|$)")


def normalize_path(path):
    """Replace numeric path segments with {id} and cap the length."""
    return NUMERIC_SEGMENT.sub("/{id}", path)[:255]


class ApiMonitoringMiddleware:
    """
    Logs every /api/ request with its response time and status code.

    - Response time and status are stored in ApiRequestLog.
    - Unhandled exceptions are captured with their message.
    - Slow requests and 5xx responses are also written to logs/api.log.

    A logging failure must never break the actual API response.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not self._should_log(request.path):
            return self.get_response(request)

        start = time.perf_counter()
        request._monitoring_error = ""

        response = self.get_response(request)

        elapsed_ms = (time.perf_counter() - start) * 1000

        self._record(request, response.status_code, elapsed_ms)

        response["X-Response-Time-ms"] = f"{elapsed_ms:.2f}"

        return response

    def process_exception(self, request, exception):
        request._monitoring_error = (
            f"{exception.__class__.__name__}: {exception}"
        )[:2000]

        logger.exception(
            "Unhandled error on %s %s",
            request.method,
            request.path,
        )

        # Let Django continue with its normal 500 handling.
        return None

    # -----------------------------------------------------------------

    @staticmethod
    def _should_log(path):
        if not path.startswith("/api/"):
            return False

        excluded = getattr(settings, "MONITORING_EXCLUDED_PATHS", [])

        return path not in excluded

    @staticmethod
    def _record(request, status_code, elapsed_ms):
        user = getattr(request, "user", None)
        user_id = (
            user.id
            if user is not None and getattr(user, "is_authenticated", False)
            else None
        )

        error_message = getattr(request, "_monitoring_error", "")
        path = normalize_path(request.path)

        threshold = getattr(settings, "SLOW_REQUEST_THRESHOLD_MS", 1000)

        if status_code >= 500:
            logger.error(
                "%s %s -> %s in %.1fms %s",
                request.method,
                path,
                status_code,
                elapsed_ms,
                error_message,
            )
        elif elapsed_ms > threshold:
            logger.warning(
                "Slow request %s %s -> %s in %.1fms",
                request.method,
                path,
                status_code,
                elapsed_ms,
            )

        try:
            ApiRequestLog.objects.create(
                service=ApiRequestLog.DJANGO,
                method=request.method,
                path=path,
                status_code=status_code,
                response_time_ms=round(elapsed_ms, 2),
                user_id=user_id,
                error_message=error_message,
            )
        except Exception:
            logger.exception("Could not store API request log.")
