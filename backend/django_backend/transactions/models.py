
from django.conf import settings
from django.db import models


class Transaction(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    )

    CATEGORY_CHOICES = (
        ("SHOPPING", "Shopping"),
        ("FOOD", "Food"),
        ("TRAVEL", "Travel"),
        ("BILLS", "Bills"),
        ("ENTERTAINMENT", "Entertainment"),
        ("OTHER", "Other"),
    )

    FRAUD_STATUS_CHOICES = (
        ("CLEAR", "Clear"),
        ("FLAGGED", "Flagged"),
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

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="OTHER",
    )

    # Written by the FastAPI fraud service when a payment is processed.
    fraud_status = models.CharField(
        max_length=20,
        choices=FRAUD_STATUS_CHOICES,
        default="CLEAR",
    )

    fraud_reason = models.TextField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        indexes = [
            models.Index(
                fields=["user", "-created_at"],
                name="txn_user_created_idx",
            ),
            models.Index(
                fields=["user", "status"],
                name="txn_user_status_idx",
            ),
            models.Index(
                fields=["fraud_status"],
                name="txn_fraud_status_idx",
            ),
        ]

    def __str__(self):
        return f"Transaction #{self.id} - {self.status}"
