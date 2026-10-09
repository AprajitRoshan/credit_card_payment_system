from django.contrib import admin

from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "payment_id",
        "card_id",
        "amount",
        "currency",
        "status",
        "category",
        "fraud_status",
        "created_at",
    )
    search_fields = ("payment_id", "user__username")
    list_filter = ("status", "fraud_status", "category", "created_at")