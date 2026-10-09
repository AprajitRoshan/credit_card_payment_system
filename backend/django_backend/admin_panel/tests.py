from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Role
from admin_panel.models import AdminLog
from cards.models import Card


User = get_user_model()


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


class RoleBasedAccessTests(APITestCase):
    """
    Regression tests for RBAC on admin, card-management and export APIs.
    """

    def setUp(self):
        self.admin = create_user("admin_user", "ADMIN")
        self.support = create_user("support_user", "SUPPORT")
        self.read_only = create_user("readonly_user", "READ_ONLY")
        self.customer = create_user("customer_user", "CUSTOMER")

        self.card = Card.objects.create(
            user=self.customer,
            card_type="CREDIT",
            card_holder_name="Customer User",
            masked_card_number="************1111",
            last_four_digits="1111",
            expiry_month=12,
            expiry_year=2030,
            credit_limit=50000,
        )

        self.card_url = f"/api/admin/cards/{self.card.id}/"

    def test_roles_are_seeded(self):
        self.assertEqual(
            set(Role.objects.values_list("name", flat=True)),
            {"ADMIN", "SUPPORT", "READ_ONLY", "CUSTOMER"},
        )

    def test_new_registration_gets_customer_role(self):
        self.client.post(
            "/api/auth/register/",
            {
                "username": "newcustomer",
                "email": "newcustomer@example.com",
                "password": "TestPassword123!",
            },
            format="json",
        )

        user = User.objects.get(username="newcustomer")
        self.assertEqual(user.role.name, "CUSTOMER")

    def test_me_returns_role(self):
        self.client.force_authenticate(self.support)
        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.data["role"], "SUPPORT")

    def test_dashboard_access_by_role(self):
        for user, expected in (
            (self.admin, status.HTTP_200_OK),
            (self.support, status.HTTP_200_OK),
            (self.read_only, status.HTTP_200_OK),
            (self.customer, status.HTTP_403_FORBIDDEN),
        ):
            self.client.force_authenticate(user)
            response = self.client.get("/api/admin/dashboard/")
            self.assertEqual(response.status_code, expected, user.username)

    def test_dashboard_requires_authentication(self):
        response = self.client.get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_transaction_export_admin_only(self):
        self.client.force_authenticate(self.support)
        self.assertEqual(
            self.client.get("/api/admin/transactions/export/").status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/admin/transactions/export/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")

    def test_admin_can_update_credit_limit_and_is_audited(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            self.card_url,
            {"credit_limit": 75000},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.card.refresh_from_db()
        self.assertEqual(float(self.card.credit_limit), 75000.0)

        log = AdminLog.objects.get(action="UPDATE_CREDIT_LIMIT")
        self.assertEqual(log.admin_user, self.admin)
        self.assertEqual(log.details["new_credit_limit"], "75000.0")

    def test_support_can_block_and_unblock_but_not_change_limit(self):
        self.client.force_authenticate(self.support)

        blocked = self.client.patch(
            self.card_url, {"is_blocked": True}, format="json"
        )
        self.assertEqual(blocked.status_code, status.HTTP_200_OK)
        self.assertTrue(AdminLog.objects.filter(action="BLOCK_CARD").exists())

        unblocked = self.client.patch(
            self.card_url, {"is_blocked": False}, format="json"
        )
        self.assertEqual(unblocked.status_code, status.HTTP_200_OK)
        self.assertTrue(AdminLog.objects.filter(action="UNBLOCK_CARD").exists())

        limit = self.client.patch(
            self.card_url, {"credit_limit": 90000}, format="json"
        )
        self.assertEqual(limit.status_code, status.HTTP_403_FORBIDDEN)

    def test_read_only_cannot_modify_cards(self):
        self.client.force_authenticate(self.read_only)

        self.assertEqual(
            self.client.get("/api/admin/cards/").status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            self.client.patch(
                self.card_url, {"is_blocked": True}, format="json"
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_invalid_credit_limit_rejected(self):
        self.client.force_authenticate(self.admin)

        for value in (-10, 0, "abc"):
            response = self.client.patch(
                self.card_url, {"credit_limit": value}, format="json"
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_card_returns_404(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            "/api/admin/cards/99999/", {"is_blocked": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
