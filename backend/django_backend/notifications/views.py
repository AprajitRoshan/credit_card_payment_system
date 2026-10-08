import secrets

from django.conf import settings

from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from accounts.models import User

from .services import send_notification_email


def validate_internal_request(request):
    provided_secret = request.headers.get(
        "X-Internal-Secret"
    )

    expected_secret = (
        settings.INTERNAL_NOTIFICATION_SECRET
    )

    if not expected_secret:
        return False

    if not provided_secret:
        return False

    return secrets.compare_digest(
        provided_secret,
        expected_secret,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def send_transaction_alert(request):

    if not validate_internal_request(request):
        return Response(
            {
                "detail": "Forbidden."
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    user_id = request.data.get("user_id")
    amount = request.data.get("amount")

    if not user_id or not amount:
        return Response(
            {
                "detail": (
                    "user_id and amount are required."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response(
            {
                "detail": "User not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        amount = float(amount)

    except (TypeError, ValueError):
        return Response(
            {
                "detail": "amount must be a valid number."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if amount <= 5000:
        return Response(
            {
                "sent": False
            }
        )

    sent = send_notification_email(
        recipient_email=user.email,
        subject="Credit Card Payment Alert",
        message=(
            f"Your credit card transaction of "
            f"₹{amount:,.2f} has exceeded the "
            "₹5,000 notification threshold."
        ),
    )

    return Response(
        {
            "sent": sent
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def send_credit_limit_alert(request):

    if not validate_internal_request(request):
        return Response(
            {
                "detail": "Forbidden."
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    user_id = request.data.get("user_id")

    available_credit = request.data.get(
        "available_credit"
    )

    credit_limit = request.data.get(
        "credit_limit"
    )

    if (
        not user_id
        or available_credit is None
        or credit_limit is None
    ):
        return Response(
            {
                "detail": (
                    "user_id, available_credit and "
                    "credit_limit are required."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response(
            {
                "detail": "User not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        available_credit = float(
            available_credit
        )

        credit_limit = float(
            credit_limit
        )

    except (TypeError, ValueError):
        return Response(
            {
                "detail": (
                    "Credit values must be numbers."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if credit_limit <= 0:
        return Response(
            {
                "sent": False
            }
        )

    available_percentage = (
        available_credit / credit_limit
    ) * 100

    if available_percentage >= 10:
        return Response(
            {
                "sent": False,
                "available_percentage": round(
                    available_percentage,
                    2,
                ),
            }
        )

    sent = send_notification_email(
        recipient_email=user.email,
        subject="Low Available Credit Alert",
        message=(
            "Your available credit has fallen "
            "below 10% of your total credit limit.\n\n"
            f"Credit Limit: "
            f"₹{credit_limit:,.2f}\n"
            f"Available Credit: "
            f"₹{available_credit:,.2f}\n"
            f"Available Credit Percentage: "
            f"{available_percentage:.2f}%"
        ),
    )

    return Response(
        {
            "sent": sent,
            "available_percentage": round(
                available_percentage,
                2,
            ),
        }
    )