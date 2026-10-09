from django.contrib import admin

from .models import ApiRequestLog


@admin.register(ApiRequestLog)
class ApiRequestLogAdmin(admin.ModelAdmin):
    list_display = (
        "created_at",
        "service",
        "method",
        "path",
        "status_code",
        "response_time_ms",
        "user_id",
    )
    list_filter = ("service", "status_code", "method", "created_at")
    search_fields = ("path", "error_message")
    readonly_fields = [field.name for field in ApiRequestLog._meta.fields]
