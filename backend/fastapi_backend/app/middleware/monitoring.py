import logging
import re
import time

import jwt
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.database import SessionLocal
from app.models.api_request_log import ApiRequestLog
from app.services.fraud_service import utc_now


logger = logging.getLogger("payment_api.monitoring")

NUMERIC_SEGMENT = re.compile(r"/\d+(?=/|$)")

EXCLUDED_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}

SLOW_REQUEST_THRESHOLD_MS = 1000


def normalize_path(path: str) -> str:
    return NUMERIC_SEGMENT.sub("/{id}", path)[:255]


def user_id_from_request(request: Request):
    """
    Best-effort user id for the log row. The token is not verified here;
    verification still happens in the route dependency.
    """
    user_id = request.query_params.get("user_id")

    if user_id and user_id.isdigit():
        return int(user_id)

    auth = request.headers.get("authorization", "")

    if auth.lower().startswith("bearer "):
        try:
            payload = jwt.decode(
                auth[7:],
                options={"verify_signature": False},
            )
            value = payload.get("user_id")
            return int(value) if value is not None else None
        except (jwt.PyJWTError, TypeError, ValueError):
            return None

    return None


class ApiMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Logs response time, status code and unhandled errors for every
    FastAPI request into monitoring_apirequestlog (service="fastapi").
    """

    async def dispatch(self, request: Request, call_next):
        if request.url.path in EXCLUDED_PATHS:
            return await call_next(request)

        start = time.perf_counter()
        error_message = ""

        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            error_message = f"{exc.__class__.__name__}: {exc}"[:2000]
            logger.exception(
                "Unhandled error on %s %s",
                request.method,
                request.url.path,
            )
            status_code = 500
            response = JSONResponse(
                {"detail": "Internal server error."},
                status_code=500,
            )

        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Response-Time-ms"] = f"{elapsed_ms:.2f}"

        if status_code >= 500:
            logger.error(
                "%s %s -> %s in %.1fms",
                request.method,
                request.url.path,
                status_code,
                elapsed_ms,
            )
        elif elapsed_ms > SLOW_REQUEST_THRESHOLD_MS:
            logger.warning(
                "Slow request %s %s -> %s in %.1fms",
                request.method,
                request.url.path,
                status_code,
                elapsed_ms,
            )

        self._store(
            method=request.method,
            path=normalize_path(request.url.path),
            status_code=status_code,
            elapsed_ms=elapsed_ms,
            user_id=user_id_from_request(request),
            error_message=error_message,
        )

        return response

    @staticmethod
    def _store(**values):
        db = SessionLocal()

        try:
            db.add(
                ApiRequestLog(
                    service="fastapi",
                    method=values["method"],
                    path=values["path"],
                    status_code=values["status_code"],
                    response_time_ms=round(values["elapsed_ms"], 2),
                    user_id=values["user_id"],
                    error_message=values["error_message"],
                    created_at=utc_now(),
                )
            )
            db.commit()
        except Exception:
            # Monitoring must never break the API.
            db.rollback()
            logger.debug("Could not store API request log.", exc_info=True)
        finally:
            db.close()
