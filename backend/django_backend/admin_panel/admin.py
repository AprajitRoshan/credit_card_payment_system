from django.contrib import admin
from .models import AdminLog


@admin.register(AdminLog)
class AdminLogAdmin(admin.ModelAdmin):
    list_display = ("admin_user", "action", "target", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("admin_user__username", "action", "target")
    readonly_fields = ("created_at",)