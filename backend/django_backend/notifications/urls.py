from django.urls import path

from .views import (
    send_transaction_alert,
    send_credit_limit_alert,
    send_fraud_alert,
)

urlpatterns = [
    path(
        "transaction-alert/",
        send_transaction_alert,
        name="transaction-alert",
    ),
    path(
        "credit-limit-alert/",
        send_credit_limit_alert,
        name="credit-limit-alert",
    ),
    path(
        "fraud-alert/",
        send_fraud_alert,
        name="fraud-alert",
    ),
]