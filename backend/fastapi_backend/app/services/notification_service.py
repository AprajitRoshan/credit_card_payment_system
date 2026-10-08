import os

import requests

from dotenv import load_dotenv


load_dotenv()


DJANGO_NOTIFICATION_URL = (
    "http://127.0.0.1:8000/api/"
    "notifications/transaction-alert/"
)


def send_transaction_alert(
    user_id: int,
    amount: float,
):
    if amount <= 5000:
        return

    internal_secret = os.getenv(
        "INTERNAL_NOTIFICATION_SECRET"
    )

    if not internal_secret:
        return

    try:
        requests.post(
            DJANGO_NOTIFICATION_URL,
            json={
                "user_id": user_id,
                "amount": amount,
            },
            headers={
                "X-Internal-Secret": internal_secret,
            },
            timeout=5,
        )

    except requests.RequestException:
        pass