import csv
from datetime import date

from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.http import HttpResponse

from accounts.permissions import (
    IsAdminRole,
    CanViewAdminData,
    CanManageCards,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from cards.models import Card
from transactions.models import Transaction
from notifications.services import send_notification_email

from .models import AdminLog


User = get_user_model()


class AdminDashboardView(APIView):
    permission_classes = [CanViewAdminData]

    def get(self, request):
        today = date.today()

        total_users = User.objects.count()

        total_cards = Card.objects.count()

        total_transactions = Transaction.objects.count()

        successful_transactions = Transaction.objects.filter(
            status="SUCCESS"
        ).count()

        failed_transactions = Transaction.objects.filter(
            status="FAILED"
        ).count()

        pending_transactions = Transaction.objects.filter(
            status="PENDING"
        ).count()

        total_payment_amount = (
            Transaction.objects
            .filter(status="SUCCESS")
            .aggregate(total=Sum("amount"))["total"]
            or 0
        )

        today_transactions = Transaction.objects.filter(
            created_at__date=today
        )

        today_success = today_transactions.filter(
            status="SUCCESS"
        ).count()

        today_failed = today_transactions.filter(
            status="FAILED"
        ).count()

        today_amount = (
            today_transactions
            .filter(status="SUCCESS")
            .aggregate(total=Sum("amount"))["total"]
            or 0
        )

        AdminLog.objects.create(
            admin_user=request.user,
            action="VIEW_DASHBOARD",
            target="Admin Dashboard",
        )

        return Response(
            {
                "total_users": total_users,
                "total_cards": total_cards,
                "total_transactions": total_transactions,
                "successful_transactions": successful_transactions,
                "failed_transactions": failed_transactions,
                "pending_transactions": pending_transactions,
                "total_payment_amount": total_payment_amount,
                "daily_summary": {
                    "date": today,
                    "successful_payments": today_success,
                    "failed_payments": today_failed,
                    "successful_amount": today_amount,
                },
            }
        )


class AdminTransactionExportView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        transactions = (
            Transaction.objects
            .select_related("user")
            .order_by("-created_at")
        )

        response = HttpResponse(
            content_type="text/csv"
        )

        response["Content-Disposition"] = (
            'attachment; filename="transactions.csv"'
        )

        writer = csv.writer(response)

        writer.writerow(
            [
                "ID",
                "Username",
                "Payment ID",
                "Card ID",
                "Amount",
                "Currency",
                "Status",
                "Created At",
            ]
        )

        for transaction in transactions:
            writer.writerow(
                [
                    transaction.id,
                    transaction.user.username,
                    transaction.payment_id,
                    transaction.card_id,
                    transaction.amount,
                    transaction.currency,
                    transaction.status,
                    transaction.created_at,
                ]
            )

        AdminLog.objects.create(
            admin_user=request.user,
            action="EXPORT_TRANSACTIONS",
            target="transactions.csv",
        )

        # Important: return the generated CSV.
        return response


class AdminCardManagementView(APIView):
    permission_classes = [CanManageCards]

    def get(self, request):
        """
        Return all cards for administrator card management.
        """

        cards = (
            Card.objects
            .select_related("user")
            .order_by("-id")
        )

        card_data = []

        for card in cards:
            recent_transactions = (
                Transaction.objects
                .filter(card_id=card.id)
                .order_by("-created_at")[:5]
            )

            activity = []

            for transaction in recent_transactions:
                activity.append(
                    {
                        "id": transaction.id,
                        "payment_id": transaction.payment_id,
                        "amount": float(
                            transaction.amount
                        ),
                        "currency": transaction.currency,
                        "status": transaction.status,
                        "created_at": transaction.created_at,
                    }
                )

            card_data.append(
                {
                    "id": card.id,
                    "user_id": card.user.id,
                    "username": card.user.username,
                    "email": card.user.email,
                    "card_type": card.card_type,
                    "card_holder_name": (
                        card.card_holder_name
                    ),
                    "masked_card_number": (
                        card.masked_card_number
                    ),
                    "last_four_digits": (
                        card.last_four_digits
                    ),
                    "expiry_month": (
                        card.expiry_month
                    ),
                    "expiry_year": (
                        card.expiry_year
                    ),
                    "credit_limit": float(
                        card.credit_limit
                    ),
                    "is_blocked": card.is_blocked,
                    "created_at": card.created_at,
                    "activity": activity,
                }
            )

        AdminLog.objects.create(
            admin_user=request.user,
            action="VIEW_CARDS",
            target="All Cards",
        )

        return Response(card_data)

    def patch(self, request, card_id):
        """
        Block/unblock a card and/or update credit limit.
        """

        try:
            card = (
                Card.objects
                .select_related("user")
                .get(id=card_id)
            )

        except Card.DoesNotExist:
            return Response(
                {
                    "detail": "Card not found."
                },
                status=404,
            )

        is_blocked = request.data.get(
            "is_blocked"
        )

        credit_limit = request.data.get(
            "credit_limit"
        )

        if (
            is_blocked is None
            and credit_limit is None
        ):
            return Response(
                {
                    "detail": (
                        "Provide is_blocked or "
                        "credit_limit."
                    )
                },
                status=400,
            )

        was_blocked = card.is_blocked
        old_credit_limit = str(card.credit_limit)
        old_is_blocked = card.is_blocked

        # ---------------------------------------------
        # BLOCK / UNBLOCK
        # ---------------------------------------------

        if is_blocked is not None:
            if not isinstance(
                is_blocked,
                bool,
            ):
                return Response(
                    {
                        "detail": (
                            "is_blocked must be "
                            "true or false."
                        )
                    },
                    status=400,
                )

            card.is_blocked = is_blocked

        # ---------------------------------------------
        # CREDIT LIMIT
        # ---------------------------------------------

        if credit_limit is not None:
            try:
                credit_limit = float(
                    credit_limit
                )

                if credit_limit <= 0:
                    raise ValueError

                card.credit_limit = credit_limit

            except (
                TypeError,
                ValueError,
            ):
                return Response(
                    {
                        "detail": (
                            "credit_limit must be "
                            "a positive number."
                        )
                    },
                    status=400,
                )

        card.save()

        # ---------------------------------------------
        # BLOCK EMAIL
        # ---------------------------------------------

        if (
            card.is_blocked
            and not was_blocked
        ):
            send_notification_email(
                recipient_email=card.user.email,
                subject="Credit Card Blocked",
                message=(
                    f"Your credit card ending in "
                    f"{card.last_four_digits} has "
                    "been blocked by the "
                    "administrator."
                ),
            )

        # ---------------------------------------------
        # ADMIN LOG
        # ---------------------------------------------

        if (
            is_blocked is not None
            and card.is_blocked
            and not was_blocked
        ):
            action = "BLOCK_CARD"

        elif (
            is_blocked is not None
            and not card.is_blocked
            and was_blocked
        ):
            action = "UNBLOCK_CARD"

        elif credit_limit is not None:
            action = "UPDATE_CREDIT_LIMIT"

        else:
            action = "UPDATE_CARD"

        AdminLog.objects.create(
            admin_user=request.user,
            action=action,
            target=f"Card {card.id}",
            details={
                "old_is_blocked": old_is_blocked,
                "new_is_blocked": card.is_blocked,
                "old_credit_limit": old_credit_limit,
                "new_credit_limit": str(card.credit_limit),
            },
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return Response(
            {
                "id": card.id,
                "masked_card_number": (
                    card.masked_card_number
                ),
                "is_blocked": card.is_blocked,
                "credit_limit": float(
                    card.credit_limit
                ),
            }
        )