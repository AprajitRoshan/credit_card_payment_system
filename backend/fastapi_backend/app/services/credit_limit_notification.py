import os

import requests

from dotenv import load_dotenv


load_dotenv()


DJANGO_CREDIT_LIMIT_NOTIFICATION_URL = (
    "http://127.0.0.1:8000/api/"
    "notifications/credit-limit-alert/"
)


def send_credit_limit_alert(
    user_id: int,
    available_credit: float,
    credit_limit: float,
):
    if credit_limit <= 0:
        return

    available_percentage = (
        available_credit / credit_limit
    ) * 100

    if available_percentage >= 10:
        return

    internal_secret = os.getenv(
        "INTERNAL_NOTIFICATION_SECRET"
    )

    if not internal_secret:
        return

    try:
        requests.post(
            DJANGO_CREDIT_LIMIT_NOTIFICATION_URL,
            json={
                "user_id": user_id,
                "available_credit": available_credit,
                "credit_limit": credit_limit,
            },
            headers={
                "X-Internal-Secret": internal_secret,
            },
            timeout=5,
        )

    except requests.RequestException:
        pass