
from django.conf import settings
from django.db import models


class AdminLog(models.Model):
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admin_logs",
    )
    action = models.CharField(max_length=100)
    target = models.CharField(max_length=255, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        actor = (
            self.admin_user.username
            if self.admin_user
            else "Deleted user"
        )
        return f"{actor} - {self.action}"
