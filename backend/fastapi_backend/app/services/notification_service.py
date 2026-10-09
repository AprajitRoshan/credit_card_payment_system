
import logging
import os

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("payment_api.notifications")

# In Docker this is http://django:8000/api (see docker-compose.yml).
DJANGO_API_URL = os.getenv(
    "DJANGO_API_URL",
    "http://127.0.0.1:8000/api",
).rstrip("/")

DJANGO_NOTIFICATION_URL = f"{DJANGO_API_URL}/notifications/"

HIGH_VALUE_ALERT_THRESHOLD = 5000


def _post_notification(endpoint: str, payload: dict):
    """
    Calls the Django notification endpoint.
    Returns True when Django reports that the email was sent.
    """
    internal_secret = os.getenv("INTERNAL_NOTIFICATION_SECRET")

    if not internal_secret:
        logger.warning("INTERNAL_NOTIFICATION_SECRET is not configured.")
        return False

    try:
        response = requests.post(
            f"{DJANGO_NOTIFICATION_URL}{endpoint}",
            json=payload,
            headers={"X-Internal-Secret": internal_secret},
            timeout=5,
        )
    except requests.RequestException as exc:
        logger.warning("Notification %s failed: %s", endpoint, exc)
        return False

    if not response.ok:
        logger.warning(
            "Notification %s returned %s",
            endpoint,
            response.status_code,
        )
        return False

    try:
        return bool(response.json().get("sent"))
    except ValueError:
        return False


def send_transaction_alert(user_id: int, amount: float):
    if amount <= HIGH_VALUE_ALERT_THRESHOLD:
        return False

    return _post_notification(
        "transaction-alert/",
        {"user_id": user_id, "amount": amount},
    )


def send_fraud_alert(user_id: int, amount: float, reason: str):
    return _post_notification(
        "fraud-alert/",
        {
            "user_id": user_id,
            "amount": amount,
            "reason": reason,
        },
    )


def send_credit_limit_alert(
    user_id: int,
    available_credit: float,
    credit_limit: float,
):
    if credit_limit <= 0:
        return False

    if available_credit / credit_limit >= 0.10:
        return False

    return _post_notification(
        "credit-limit-alert/",
        {
            "user_id": user_id,
            "available_credit": available_credit,
            "credit_limit": credit_limit,
        },
    )
