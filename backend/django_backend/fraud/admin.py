from django.contrib import admin

from .models import FraudLog


@admin.register(FraudLog)
class FraudLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "payment_id",
        "amount",
        "rules_triggered",
        "alert_sent",
        "review_status",
        "created_at",
    )
    list_filter = ("review_status", "alert_sent", "created_at")
    search_fields = ("user__username", "payment_id", "rules_triggered")
    readonly_fields = ("created_at",)
