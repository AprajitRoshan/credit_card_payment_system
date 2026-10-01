import csv
from datetime import date

from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.http import HttpResponse

from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from cards.models import Card
from transactions.models import Transaction

from .models import AdminLog


User = get_user_model()


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

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
            Transaction.objects.filter(status="SUCCESS")
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
            today_transactions.filter(status="SUCCESS")
            .aggregate(total=Sum("amount"))["total"]
            or 0
        )

        # Create an admin activity log
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
    permission_classes = [IsAdminUser]

    def get(self, request):
        transactions = (
            Transaction.objects
            .select_related("user")
            .order_by("-created_at")
        )

        response = HttpResponse(content_type="text/csv")

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

        # Create an admin activity log
        AdminLog.objects.create(
            admin_user=request.user,
            action="EXPORT_TRANSACTIONS",
            target="transactions.csv",
        )

        return response