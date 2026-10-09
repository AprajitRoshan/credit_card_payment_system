from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.test import RequestFactory, TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Role
from monitoring.middleware import ApiMonitoringMiddleware, normalize_path
from monitoring.models import ApiRequestLog


User = get_user_model()

FASTAPI_UP = {"status": "up", "latency_ms": 3.2, "database": "up"}
FASTAPI_DOWN = {"status": "down", "latency_ms": None, "detail": "refused"}


def create_user(username, role_name=None):
    user = User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="TestPassword123!",
    )

    if role_name:
        user.role = Role.objects.get(name=role_name)
        user.save()

    return user


class MiddlewareTests(TestCase):

    def test_normalize_path(self):
        self.assertEqual(
            normalize_path("/api/admin/cards/12/"),
            "/api/admin/cards/{id}/",
        )
        self.assertEqual(
            normalize_path("/api/payments/7/process"),
            "/api/payments/{id}/process",
        )

    def test_api_request_is_logged_with_response_time(self):
        user = create_user("monitored_user")
        self.client.force_login(user)

        response = self.client.get("/api/cards/")

        log = ApiRequestLog.objects.get(path="/api/cards/")
        self.assertEqual(log.service, "django")
        self.assertEqual(log.method, "GET")
        self.assertGreaterEqual(log.response_time_ms, 0)
        self.assertIn("X-Response-Time-ms", response)

    def test_non_api_and_health_paths_are_not_logged(self):
        self.client.get("/api/health/")
        self.client.get("/admin/login/")

        self.assertFalse(ApiRequestLog.objects.exists())

    def test_unhandled_exception_is_captured(self):
        factory = RequestFactory()
        request = factory.get("/api/broken/")

        def failing_view(req):
            middleware.process_exception(req, RuntimeError("boom"))
            return HttpResponse(status=500)

        middleware = ApiMonitoringMiddleware(failing_view)
        middleware(request)

        log = ApiRequestLog.objects.get(path="/api/broken/")
        self.assertEqual(log.status_code, 500)
        self.assertIn("RuntimeError: boom", log.error_message)
        self.assertTrue(log.is_error)


class HealthEndpointTests(APITestCase):

    def test_public_health_check(self):
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["database"], "up")

    @patch("monitoring.services.check_fastapi", return_value=FASTAPI_UP)
    def test_system_health_permissions(self, _mock):
        url = "/api/admin/system-health/"

        for role, expected in (
            ("ADMIN", status.HTTP_200_OK),
            ("SUPPORT", status.HTTP_200_OK),
            ("READ_ONLY", status.HTTP_200_OK),
            ("CUSTOMER", status.HTTP_403_FORBIDDEN),
        ):
            self.client.force_authenticate(create_user(f"health_{role}", role))
            self.assertEqual(self.client.get(url).status_code, expected, role)

    @patch("monitoring.services.check_fastapi", return_value=FASTAPI_UP)
    def test_system_health_metrics(self, _mock):
        ApiRequestLog.objects.bulk_create([
            ApiRequestLog(service="django", method="GET", path="/api/cards/",
                          status_code=200, response_time_ms=40),
            ApiRequestLog(service="django", method="GET", path="/api/cards/",
                          status_code=200, response_time_ms=60),
            ApiRequestLog(service="fastapi", method="POST", path="/api/payments/",
                          status_code=500, response_time_ms=900,
                          error_message="ValueError: bad"),
            ApiRequestLog(service="django", method="GET", path="/api/x/",
                          status_code=404, response_time_ms=5),
        ])

        self.client.force_authenticate(create_user("metrics_admin", "ADMIN"))
        data = self.client.get("/api/admin/system-health/").data

        metrics = data["metrics"]
        self.assertEqual(metrics["total_requests"], 4)
        self.assertEqual(metrics["server_errors"], 1)
        self.assertEqual(metrics["client_errors"], 1)
        self.assertEqual(metrics["error_rate"], 25.0)
        self.assertEqual(metrics["max_response_ms"], 900)

        self.assertEqual(data["slowest_endpoints"][0]["path"], "/api/payments/")
        self.assertEqual(len(data["recent_errors"]), 1)
        self.assertEqual(
            {row["service"] for row in data["per_service"]},
            {"django", "fastapi"},
        )
        # 25% error rate -> degraded
        self.assertEqual(data["status"], "degraded")
        self.assertEqual(data["services"]["database"]["status"], "up")

    @patch("monitoring.services.check_fastapi", return_value=FASTAPI_DOWN)
    def test_fastapi_down_marks_degraded(self, _mock):
        self.client.force_authenticate(create_user("down_admin", "ADMIN"))
        data = self.client.get("/api/admin/system-health/").data

        self.assertEqual(data["status"], "degraded")
        self.assertEqual(data["services"]["fastapi"]["status"], "down")

    @patch("monitoring.services.check_fastapi", return_value=FASTAPI_UP)
    def test_healthy_when_no_errors(self, _mock):
        self.client.force_authenticate(create_user("ok_admin", "ADMIN"))
        data = self.client.get("/api/admin/system-health/").data

        self.assertEqual(data["status"], "healthy")

    def test_invalid_hours(self):
        self.client.force_authenticate(create_user("hours_admin", "ADMIN"))

        for value in ("abc", "0", "500"):
            response = self.client.get(
                "/api/admin/system-health/", {"hours": value}
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
