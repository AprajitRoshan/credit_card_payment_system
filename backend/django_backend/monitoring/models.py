from django.db import models


class ApiRequestLog(models.Model):
    """
    API response-time and error log.

    Written by the Django monitoring middleware (service="django") and
    by the FastAPI monitoring middleware (service="fastapi").
    """

    DJANGO = "django"
    FASTAPI = "fastapi"

    SERVICE_CHOICES = (
        (DJANGO, "Django"),
        (FASTAPI, "FastAPI"),
    )

    service = models.CharField(
        max_length=20,
        choices=SERVICE_CHOICES,
        default=DJANGO,
    )

    method = models.CharField(max_length=10)

    # Numeric path segments are normalised to {id}, e.g.
    # /api/cards/12/ -> /api/cards/{id}/, so endpoints group cleanly.
    path = models.CharField(max_length=255)

    status_code = models.PositiveSmallIntegerField()

    response_time_ms = models.FloatField()

    user_id = models.BigIntegerField(null=True, blank=True)

    error_message = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["-created_at"],
                name="apilog_created_idx",
            ),
            models.Index(
                fields=["status_code", "-created_at"],
                name="apilog_status_created_idx",
            ),
        ]

    @property
    def is_error(self):
        return self.status_code >= 500 or bool(self.error_message)

    def __str__(self):
        return (
            f"[{self.service}] {self.method} {self.path} "
            f"{self.status_code} {self.response_time_ms:.0f}ms"
        )
