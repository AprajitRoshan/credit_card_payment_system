import json
import time
import urllib.error
import urllib.request
from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.db.models import Avg, Count, Max, Q
from django.db.models.functions import TruncHour
from django.utils import timezone

from fraud.models import FraudLog

from .models import ApiRequestLog


PROCESS_STARTED_AT = timezone.now()

ERROR_RATE_DEGRADED = 5.0       # percent
P95_DEGRADED_MS = 1000.0        # milliseconds


def check_database():
    start = time.perf_counter()

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()

        return {
            "status": "up",
            "latency_ms": round((time.perf_counter() - start) * 1000, 2),
        }
    except Exception as exc:
        return {
            "status": "down",
            "latency_ms": None,
            "detail": str(exc)[:200],
        }


def check_fastapi(timeout=2):
    url = settings.FASTAPI_HEALTH_URL
    start = time.perf_counter()

    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            body = json.loads(response.read().decode() or "{}")
            latency = round((time.perf_counter() - start) * 1000, 2)

            return {
                "status": "up" if body.get("status") == "ok" else "degraded",
                "latency_ms": latency,
                "database": body.get("database"),
            }
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as exc:
        return {
            "status": "down",
            "latency_ms": None,
            "detail": str(exc)[:200],
        }


def percentile_response_time(queryset, percentile):
    """
    Percentile via a single ordered OFFSET query instead of loading
    every row into Python.
    """
    total = queryset.count()

    if total == 0:
        return 0.0

    index = min(int(total * percentile), total - 1)

    value = (
        queryset.order_by("response_time_ms")
        .values_list("response_time_ms", flat=True)[index:index + 1]
    )

    return round(float(value[0]), 2) if value else 0.0


def build_system_health(hours=24, include_fastapi=True):
    now = timezone.now()
    since = now - timedelta(hours=hours)

    logs = ApiRequestLog.objects.filter(created_at__gte=since)

    error_filter = Q(status_code__gte=500) | ~Q(error_message="")

    totals = logs.aggregate(
        total=Count("id"),
        server_errors=Count("id", filter=error_filter),
        client_errors=Count(
            "id",
            filter=Q(status_code__gte=400, status_code__lt=500),
        ),
        avg_ms=Avg("response_time_ms"),
        max_ms=Max("response_time_ms"),
    )

    total = totals["total"] or 0
    server_errors = totals["server_errors"] or 0
    error_rate = (server_errors / total * 100) if total else 0.0
    p95 = percentile_response_time(logs, 0.95)

    per_service = [
        {
            "service": row["service"],
            "requests": row["requests"],
            "avg_response_ms": round(row["avg_ms"] or 0, 2),
            "errors": row["errors"],
        }
        for row in logs.values("service")
        .annotate(
            requests=Count("id"),
            avg_ms=Avg("response_time_ms"),
            errors=Count("id", filter=error_filter),
        )
        .order_by("service")
    ]

    slowest_endpoints = [
        {
            "service": row["service"],
            "method": row["method"],
            "path": row["path"],
            "requests": row["requests"],
            "avg_response_ms": round(row["avg_ms"] or 0, 2),
            "max_response_ms": round(row["max_ms"] or 0, 2),
        }
        for row in logs.values("service", "method", "path")
        .annotate(
            requests=Count("id"),
            avg_ms=Avg("response_time_ms"),
            max_ms=Max("response_time_ms"),
        )
        .order_by("-avg_ms")[:5]
    ]

    hourly = [
        {
            "hour": row["hour"],
            "requests": row["requests"],
            "avg_response_ms": round(row["avg_ms"] or 0, 2),
            "errors": row["errors"],
        }
        for row in logs.annotate(hour=TruncHour("created_at"))
        .values("hour")
        .annotate(
            requests=Count("id"),
            avg_ms=Avg("response_time_ms"),
            errors=Count("id", filter=error_filter),
        )
        .order_by("hour")
    ]

    recent_errors = [
        {
            "id": log.id,
            "service": log.service,
            "method": log.method,
            "path": log.path,
            "status_code": log.status_code,
            "response_time_ms": log.response_time_ms,
            "error_message": log.error_message,
            "created_at": log.created_at,
        }
        for log in ApiRequestLog.objects.filter(error_filter)
        .order_by("-created_at")[:10]
    ]

    database = check_database()
    fastapi = (
        check_fastapi()
        if include_fastapi
        else {"status": "unknown", "latency_ms": None}
    )

    if database["status"] == "down":
        overall = "down"
    elif (
        fastapi["status"] == "down"
        or error_rate > ERROR_RATE_DEGRADED
        or p95 > P95_DEGRADED_MS
    ):
        overall = "degraded"
    else:
        overall = "healthy"

    return {
        "status": overall,
        "checked_at": now,
        "uptime_seconds": int((now - PROCESS_STARTED_AT).total_seconds()),
        "window_hours": hours,
        "services": {
            "django": {"status": "up"},
            "database": database,
            "fastapi": fastapi,
        },
        "metrics": {
            "total_requests": total,
            "server_errors": server_errors,
            "client_errors": totals["client_errors"] or 0,
            "error_rate": round(error_rate, 2),
            "avg_response_ms": round(totals["avg_ms"] or 0, 2),
            "p95_response_ms": p95,
            "max_response_ms": round(totals["max_ms"] or 0, 2),
        },
        "per_service": per_service,
        "slowest_endpoints": slowest_endpoints,
        "hourly": hourly,
        "recent_errors": recent_errors,
        "fraud": {
            "open_cases": FraudLog.objects.filter(
                review_status=FraudLog.OPEN
            ).count(),
            "flagged_in_window": FraudLog.objects.filter(
                created_at__gte=since
            ).count(),
        },
    }
