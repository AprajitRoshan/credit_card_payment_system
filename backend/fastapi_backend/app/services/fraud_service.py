"""
Rule-based fraud evaluation for payments.

Rules (all evaluated per user inside a short time window):

    MULTIPLE_HIGH_VALUE_TRANSACTIONS
        2 or more payments above HIGH_VALUE_THRESHOLD in the window.

    RAPID_REPEATED_TRANSACTIONS
        RAPID_TRANSACTION_COUNT or more payments in the window.

    DIFFERENT_DEVICE_IN_SHORT_WINDOW
        A recent payment used a different device_id.

    DIFFERENT_LOCATION_IN_SHORT_WINDOW
        A recent payment came from a different location_id.

A single high-value payment on its own is not treated as fraud; it
already triggers the existing high-value email alert. When a flagged
payment is also high-value, HIGH_VALUE_TRANSACTION is added to the
reasons as context.
"""

import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.fraud_log import FraudLog
from app.models.payment import Payment


logger = logging.getLogger("payment_api.fraud")


HIGH_VALUE_THRESHOLD = float(os.getenv("FRAUD_HIGH_VALUE_THRESHOLD", "5000"))
FRAUD_WINDOW_MINUTES = int(os.getenv("FRAUD_WINDOW_MINUTES", "10"))
RAPID_TRANSACTION_COUNT = int(os.getenv("FRAUD_RAPID_COUNT", "3"))
MULTIPLE_HIGH_VALUE_COUNT = int(os.getenv("FRAUD_HIGH_VALUE_COUNT", "2"))

# Kept for backwards compatibility with earlier imports.
RAPID_WINDOW_MINUTES = FRAUD_WINDOW_MINUTES

RULE_DESCRIPTIONS = {
    "HIGH_VALUE_TRANSACTION": (
        f"Payment above ₹{HIGH_VALUE_THRESHOLD:,.0f}"
    ),
    "MULTIPLE_HIGH_VALUE_TRANSACTIONS": (
        f"{MULTIPLE_HIGH_VALUE_COUNT}+ high-value payments within "
        f"{FRAUD_WINDOW_MINUTES} minutes"
    ),
    "RAPID_REPEATED_TRANSACTIONS": (
        f"{RAPID_TRANSACTION_COUNT}+ payments within "
        f"{FRAUD_WINDOW_MINUTES} minutes"
    ),
    "DIFFERENT_DEVICE_IN_SHORT_WINDOW": (
        "Payments from different devices in a short time"
    ),
    "DIFFERENT_LOCATION_IN_SHORT_WINDOW": (
        "Payments from different locations in a short time"
    ),
}


def utc_now():
    """
    Naive UTC timestamp.

    MySQL DATETIME columns have no timezone, and Django (USE_TZ=True,
    TIME_ZONE=UTC) stores UTC there, so FastAPI writes naive UTC too.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_naive_utc(value):
    if value is None:
        return utc_now()

    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)

    return value


@dataclass
class FraudResult:
    status: str = "CLEAR"
    rules: list = field(default_factory=list)

    @property
    def is_flagged(self):
        return self.status == "FLAGGED"

    @property
    def reason_codes(self):
        return ",".join(self.rules) if self.rules else None

    @property
    def description(self):
        return "; ".join(
            RULE_DESCRIPTIONS.get(rule, rule) for rule in self.rules
        )


def evaluate_fraud(db: Session, payment: Payment) -> FraudResult:
    reference_time = to_naive_utc(payment.created_at)
    cutoff = reference_time - timedelta(minutes=FRAUD_WINDOW_MINUTES)

    # Earlier payments by the same user inside the window.
    recent_payments = (
        db.query(Payment)
        .filter(
            Payment.user_id == payment.user_id,
            Payment.id < payment.id,
            Payment.created_at >= cutoff,
        )
        .all()
    )

    amount = float(payment.amount)
    is_high_value = amount > HIGH_VALUE_THRESHOLD
    rules = []

    # Rule 1: multiple high-value payments in a short time
    if is_high_value:
        recent_high_value = [
            attempt
            for attempt in recent_payments
            if float(attempt.amount) > HIGH_VALUE_THRESHOLD
        ]

        if len(recent_high_value) + 1 >= MULTIPLE_HIGH_VALUE_COUNT:
            rules.append("MULTIPLE_HIGH_VALUE_TRANSACTIONS")

    # Rule 2: too many payments in a short time
    if len(recent_payments) + 1 >= RAPID_TRANSACTION_COUNT:
        rules.append("RAPID_REPEATED_TRANSACTIONS")

    # Rule 3: different device in a short time
    if payment.device_id and any(
        attempt.device_id and attempt.device_id != payment.device_id
        for attempt in recent_payments
    ):
        rules.append("DIFFERENT_DEVICE_IN_SHORT_WINDOW")

    # Rule 4: different location in a short time
    if payment.location_id and any(
        attempt.location_id and attempt.location_id != payment.location_id
        for attempt in recent_payments
    ):
        rules.append("DIFFERENT_LOCATION_IN_SHORT_WINDOW")

    if not rules:
        return FraudResult()

    if is_high_value:
        rules.insert(0, "HIGH_VALUE_TRANSACTION")

    return FraudResult(status="FLAGGED", rules=rules)


def create_fraud_log(
    db: Session,
    payment: Payment,
    transaction_id: int,
    result: FraudResult,
) -> FraudLog:
    """
    Stores a flagged attempt for admin review. Caller commits.
    """
    fraud_log = FraudLog(
        user_id=payment.user_id,
        transaction_id=transaction_id,
        payment_id=payment.id,
        card_id=payment.card_id,
        amount=payment.amount,
        rules_triggered=result.reason_codes[:255],
        device_id=payment.device_id,
        location_id=payment.location_id,
        alert_sent=False,
        review_status="OPEN",
        review_notes="",
        created_at=utc_now(),
    )

    db.add(fraud_log)

    logger.warning(
        "Fraud flagged: payment=%s user=%s amount=%.2f rules=%s",
        payment.id,
        payment.user_id,
        float(payment.amount),
        result.reason_codes,
    )

    return fraud_log
