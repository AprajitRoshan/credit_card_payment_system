from django.conf import settings
from django.db import models


class Transaction(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )

    payment_id = models.IntegerField()
    card_id = models.IntegerField()

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    currency = models.CharField(
        max_length=3,
        default="INR",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"Transaction #{self.id} - {self.status}"