from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Role
from admin_panel.models import AdminLog
from fraud.models import FraudLog
from transactions.models import Transaction


User = get_user_model()

INTERNAL_SECRET = "test-internal-secret"


def create_user(username, role_name=None):
    user = User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="TestPassword123!",
    )

    if role_name:
        user.role = Role.objects.get(name=role_name)
        user.save()

    return user


class FraudLogApiTests(APITestCase):

    def setUp(self):
        self.admin = create_user("fraud_admin", "ADMIN")
        self.support = create_user("fraud_support", "SUPPORT")
        self.read_only = create_user("fraud_readonly", "READ_ONLY")
        self.customer = create_user("fraud_customer", "CUSTOMER")

        transaction = Transaction.objects.create(
            user=self.customer,
            payment_id=1,
            card_id=1,
            amount=9000,
            status="SUCCESS",
            fraud_status="FLAGGED",
            fraud_reason="HIGH_VALUE_TRANSACTION,MULTIPLE_HIGH_VALUE_TRANSACTIONS",
        )

        self.log = FraudLog.objects.create(
            user=self.customer,
            transaction=transaction,
            payment_id=1,
            card_id=1,
            amount=9000,
            rules_triggered="HIGH_VALUE_TRANSACTION,MULTIPLE_HIGH_VALUE_TRANSACTIONS",
            device_id="device-a",
            location_id="Asia/Kolkata",
            alert_sent=True,
        )

        FraudLog.objects.create(
            user=self.customer,
            payment_id=2,
            card_id=1,
            amount=200,
            rules_triggered="RAPID_REPEATED_TRANSACTIONS",
            review_status=FraudLog.FALSE_POSITIVE,
        )

        self.list_url = "/api/fraud/logs/"
        self.review_url = f"/api/fraud/logs/{self.log.id}/review/"

    def test_list_permissions(self):
        for user, expected in (
            (self.admin, status.HTTP_200_OK),
            (self.support, status.HTTP_200_OK),
            (self.read_only, status.HTTP_200_OK),
            (self.customer, status.HTTP_403_FORBIDDEN),
        ):
            self.client.force_authenticate(user)
            self.assertEqual(
                self.client.get(self.list_url).status_code,
                expected,
                user.username,
            )

    def test_list_is_paginated_with_open_count(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.list_url)

        self.assertEqual(response.data["count"], 2)
        self.assertEqual(response.data["open_count"], 1)

        first = response.data["results"][0]
        self.assertIn("rules", first)
        self.assertIsInstance(first["rules"], list)

    def test_filters(self):
        self.client.force_authenticate(self.admin)

        response = self.client.get(self.list_url, {"review_status": "open"})
        self.assertEqual(response.data["count"], 1)

        response = self.client.get(self.list_url, {"rule": "rapid"})
        self.assertEqual(response.data["count"], 1)

        response = self.client.get(self.list_url, {"review_status": "BAD"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.get(self.list_url, {"start_date": "bad"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_support_can_review_and_action_is_audited(self):
        self.client.force_authenticate(self.support)

        response = self.client.patch(
            self.review_url,
            {
                "review_status": "CONFIRMED_FRAUD",
                "review_notes": "Customer confirmed card was stolen.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.log.refresh_from_db()
        self.assertEqual(self.log.review_status, FraudLog.CONFIRMED)
        self.assertEqual(self.log.reviewed_by, self.support)
        self.assertIsNotNone(self.log.reviewed_at)

        audit = AdminLog.objects.get(action="REVIEW_FRAUD")
        self.assertEqual(audit.details["new_review_status"], "CONFIRMED_FRAUD")

    def test_read_only_cannot_review(self):
        self.client.force_authenticate(self.read_only)

        response = self.client.patch(
            self.review_url,
            {"review_status": "FALSE_POSITIVE"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_review_status(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            self.review_url,
            {"review_status": "MAYBE"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_review_unknown_log(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            "/api/fraud/logs/99999/review/",
            {"review_status": "FALSE_POSITIVE"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(INTERNAL_NOTIFICATION_SECRET=INTERNAL_SECRET)
class FraudAlertEmailTests(APITestCase):
    """
    The FastAPI fraud service calls this endpoint to email the customer.
    """

    def setUp(self):
        self.user = create_user("alert_user")
        self.url = "/api/notifications/fraud-alert/"

    def test_fraud_alert_sends_email(self):
        response = self.client.post(
            self.url,
            {
                "user_id": self.user.id,
                "amount": 12000,
                "reason": "2+ high-value payments within 10 minutes",
            },
            format="json",
            HTTP_X_INTERNAL_SECRET=INTERNAL_SECRET,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["sent"])
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Suspicious Payment Alert")
        self.assertIn("high-value", mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].to, [self.user.email])

    def test_fraud_alert_requires_internal_secret(self):
        response = self.client.post(
            self.url,
            {"user_id": self.user.id, "amount": 100, "reason": "x"},
            format="json",
            HTTP_X_INTERNAL_SECRET="wrong",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(len(mail.outbox), 0)

    def test_fraud_alert_validates_payload(self):
        response = self.client.post(
            self.url,
            {"user_id": self.user.id, "amount": -5, "reason": "x"},
            format="json",
            HTTP_X_INTERNAL_SECRET=INTERNAL_SECRET,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
