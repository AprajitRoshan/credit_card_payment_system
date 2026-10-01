from django.conf import settings
from django.db import models


class AdminLog(models.Model):
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="admin_logs",
    )
    action = models.CharField(max_length=100)
    target = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.admin_user.username} - {self.action}"