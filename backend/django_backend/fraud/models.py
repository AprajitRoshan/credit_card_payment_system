from django.conf import settings
from django.db import models


class FraudLog(models.Model):
    """
    One row per payment flagged by the fraud detection service.

    Rows are inserted by the FastAPI payment service (table
    ``fraud_fraudlog``) and reviewed by Admin / Support users here.
    """

    OPEN = "OPEN"
    CONFIRMED = "CONFIRMED_FRAUD"
    FALSE_POSITIVE = "FALSE_POSITIVE"

    REVIEW_STATUS_CHOICES = (
        (OPEN, "Open"),
        (CONFIRMED, "Confirmed Fraud"),
        (FALSE_POSITIVE, "False Positive"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="fraud_logs",
    )

    transaction = models.ForeignKey(
        "transactions.Transaction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fraud_logs",
    )

    payment_id = models.IntegerField()
    card_id = models.IntegerField()

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    # Comma-separated rule codes, e.g. "RAPID_REPEATED_TRANSACTIONS".
    rules_triggered = models.CharField(max_length=255)

    device_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    location_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    alert_sent = models.BooleanField(default=False)

    review_status = models.CharField(
        max_length=20,
        choices=REVIEW_STATUS_CHOICES,
        default=OPEN,
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_fraud_logs",
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    review_notes = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["review_status", "-created_at"],
                name="fraud_status_created_idx",
            ),
        ]

    @property
    def rules(self):
        return [
            rule
            for rule in (self.rules_triggered or "").split(",")
            if rule
        ]

    def __str__(self):
        return f"Fraud #{self.id} - payment {self.payment_id}"
