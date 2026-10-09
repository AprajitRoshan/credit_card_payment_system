from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from cards.models import Card
from transactions.models import Transaction


User = get_user_model()


def make_transaction(user, card, amount, status_value="SUCCESS",
                     category="OTHER", days_ago=0, fraud="CLEAR",
                     created_at=None):
    transaction = Transaction.objects.create(
        user=user,
        payment_id=Transaction.objects.count() + 1,
        card_id=card.id,
        amount=amount,
        status=status_value,
        category=category,
        fraud_status=fraud,
    )

    # created_at is auto_now_add, so adjust it after insert.
    when = created_at or (timezone.now() - timedelta(days=days_ago))
    Transaction.objects.filter(id=transaction.id).update(created_at=when)

    return transaction


class TransactionSearchTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="search_user",
            email="search@example.com",
            password="TestPassword123!",
        )
        self.other = User.objects.create_user(
            username="other_user",
            email="other@example.com",
            password="TestPassword123!",
        )

        self.card_a = Card.objects.create(
            user=self.user, card_type="CREDIT", card_holder_name="A",
            masked_card_number="************1111", last_four_digits="1111",
            expiry_month=1, expiry_year=2030,
        )
        self.card_b = Card.objects.create(
            user=self.user, card_type="CREDIT", card_holder_name="B",
            masked_card_number="************4242", last_four_digits="4242",
            expiry_month=1, expiry_year=2030,
        )
        other_card = Card.objects.create(
            user=self.other, card_type="CREDIT", card_holder_name="O",
            masked_card_number="************1111", last_four_digits="1111",
            expiry_month=1, expiry_year=2030,
        )

        make_transaction(self.user, self.card_a, 100, "SUCCESS", days_ago=0)
        make_transaction(self.user, self.card_a, 700, "FAILED", days_ago=5)
        make_transaction(self.user, self.card_b, 7000, "SUCCESS", days_ago=10,
                         fraud="FLAGGED")
        make_transaction(self.user, self.card_b, 300, "PENDING", days_ago=20)
        make_transaction(self.other, other_card, 999, "SUCCESS")

        self.client.force_authenticate(self.user)
        self.url = "/api/transactions/"

    def get(self, **params):
        return self.client.get(self.url, params)

    def test_paginated_response_only_own_transactions(self):
        response = self.get()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 4)
        self.assertIn("results", response.data)
        self.assertIn("fraud_status", response.data["results"][0])

    def test_page_size_and_pages(self):
        response = self.get(limit=3, page=2)

        self.assertEqual(len(response.data["results"]), 1)
        self.assertIsNone(response.data["next"])

    def test_status_filter(self):
        self.assertEqual(self.get(status="success").data["count"], 2)
        self.assertEqual(
            self.get(status="bad").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_amount_range(self):
        self.assertEqual(self.get(min_amount=200, max_amount=800).data["count"], 2)
        self.assertEqual(
            self.get(min_amount=900, max_amount=100).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.get(min_amount="abc").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_date_range(self):
        today = timezone.localdate()
        start = (today - timedelta(days=12)).isoformat()
        end = (today - timedelta(days=1)).isoformat()

        self.assertEqual(self.get(start_date=start, end_date=end).data["count"], 2)
        self.assertEqual(
            self.get(start_date=end, end_date=start).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.get(start_date="2026-13-40").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_masked_card_search(self):
        for query in ("4242", "**** 4242", "************4242"):
            self.assertEqual(self.get(card_number=query).data["count"], 2, query)

        self.assertEqual(
            self.get(card_number="****").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_fraud_status_filter(self):
        self.assertEqual(self.get(fraud_status="flagged").data["count"], 1)

    def test_server_side_sorting(self):
        amounts = [
            float(item["amount"])
            for item in self.get(ordering="amount").data["results"]
        ]
        self.assertEqual(amounts, sorted(amounts))

        amounts = [
            float(item["amount"])
            for item in self.get(ordering="-amount").data["results"]
        ]
        self.assertEqual(amounts, sorted(amounts, reverse=True))

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.get().status_code, status.HTTP_401_UNAUTHORIZED)


class AnalyticsTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="analytics_user",
            email="analytics@example.com",
            password="TestPassword123!",
        )
        self.card = Card.objects.create(
            user=self.user, card_type="CREDIT", card_holder_name="A",
            masked_card_number="************1111", last_four_digits="1111",
            expiry_month=1, expiry_year=2030, credit_limit=10000,
        )

        mid_month = timezone.make_aware(datetime(2026, 10, 15, 12, 0))
        prev_month = timezone.make_aware(datetime(2026, 8, 10, 12, 0))

        make_transaction(self.user, self.card, 1000, "SUCCESS", "FOOD",
                         created_at=mid_month)
        make_transaction(self.user, self.card, 500, "SUCCESS", "TRAVEL",
                         created_at=mid_month)
        make_transaction(self.user, self.card, 400, "FAILED", "FOOD",
                         created_at=mid_month, fraud="FLAGGED")
        make_transaction(self.user, self.card, 2000, "SUCCESS", "BILLS",
                         created_at=prev_month)

        self.client.force_authenticate(self.user)
        self.params = {"month": 10, "year": 2026}

    def test_analytics_summary(self):
        data = self.client.get("/api/transactions/analytics/", self.params).data

        self.assertEqual(data["monthly_spending"], 1500.0)
        self.assertEqual(data["transaction_counts"]["successful"], 2)
        self.assertEqual(data["transaction_counts"]["failed"], 1)
        self.assertEqual(data["transaction_counts"]["flagged"], 1)

        categories = {item["category"]: item["amount"] for item in data["category_expenses"]}
        self.assertEqual(categories, {"FOOD": 1000.0, "TRAVEL": 500.0})

        # Utilization covers all successful spend on the card.
        self.assertEqual(data["credit_utilization"]["total_used"], 3500.0)
        self.assertEqual(data["credit_utilization"]["percentage"], 35.0)

    def test_monthly_trend_has_six_months(self):
        trend = self.client.get(
            "/api/transactions/analytics/", self.params
        ).data["monthly_trend"]

        self.assertEqual(len(trend), 6)
        self.assertEqual(trend[0]["label"], "May 2026")
        self.assertEqual(trend[-1]["label"], "Oct 2026")
        self.assertEqual(trend[3]["spending"], 2000.0)   # Aug
        self.assertEqual(trend[-1]["spending"], 1500.0)  # Oct

    def test_trend_crosses_year_boundary(self):
        trend = self.client.get(
            "/api/transactions/analytics/", {"month": 2, "year": 2026}
        ).data["monthly_trend"]

        self.assertEqual(trend[0]["label"], "Sep 2025")

    def test_invalid_month(self):
        response = self.client.get(
            "/api/transactions/analytics/", {"month": 13, "year": 2026}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_csv_export(self):
        response = self.client.get(
            "/api/transactions/analytics/export/csv/", self.params
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertIn(
            "analytics_summary_2026_10.csv",
            response["Content-Disposition"],
        )

        content = response.content.decode()
        self.assertIn("Monthly Spending (INR),1500.0", content)
        self.assertIn("FOOD,1000.0,1", content)
        self.assertIn("************1111", content)

    def test_pdf_export(self):
        response = self.client.get(
            "/api/transactions/analytics/export/pdf/", self.params
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))

    def test_invalid_export_format(self):
        response = self.client.get(
            "/api/transactions/analytics/export/xls/", self.params
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_export_requires_authentication(self):
        self.client.force_authenticate(None)

        response = self.client.get("/api/transactions/analytics/export/csv/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_monthly_statement_pdf_works_without_windows_fonts(self):
        response = self.client.get("/api/statements/monthly/", self.params)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.content.startswith(b"%PDF"))
