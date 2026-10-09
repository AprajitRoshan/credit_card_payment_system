from django.utils import timezone

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import CanViewAdminData

from .services import build_system_health, check_database


class HealthCheckView(APIView):
    """
    GET /api/health/

    Public liveness check used by Docker / uptime monitors.
    Returns 503 when the database is unreachable.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        database = check_database()
        healthy = database["status"] == "up"

        return Response(
            {
                "status": "ok" if healthy else "error",
                "service": "django",
                "database": database["status"],
                "timestamp": timezone.now(),
            },
            status=200 if healthy else 503,
        )


class SystemHealthView(APIView):
    """
    GET /api/admin/system-health/?hours=24

    Detailed health and API metrics for the admin dashboard.
    Available to Admin, Support and Read-Only roles.
    """

    permission_classes = [CanViewAdminData]

    def get(self, request):
        try:
            hours = int(request.query_params.get("hours", 24))
        except (TypeError, ValueError):
            return Response(
                {"detail": "hours must be an integer."},
                status=400,
            )

        if not 1 <= hours <= 168:
            return Response(
                {"detail": "hours must be between 1 and 168."},
                status=400,
            )

        return Response(build_system_health(hours=hours))
