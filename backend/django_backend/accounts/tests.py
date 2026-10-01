from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User


class AuthenticationTests(APITestCase):

    def setUp(self):
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.me_url = "/api/auth/me/"

        self.user_data = {
            "username": "testauthuser",
            "email": "testauth@example.com",
            "password": "TestPassword123!",
        }

    def test_user_registration(self):
        response = self.client.post(
            self.register_url,
            self.user_data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(username="testauthuser").exists()
        )

    def test_password_is_hashed(self):
        user = User.objects.create_user(
            username="hashuser",
            email="hash@example.com",
            password="TestPassword123!",
        )

        self.assertNotEqual(
            user.password,
            "TestPassword123!",
        )

        self.assertTrue(
            user.check_password("TestPassword123!")
        )

    def test_login_returns_jwt(self):
        User.objects.create_user(
            username="loginuser",
            email="login@example.com",
            password="TestPassword123!",
        )

        response = self.client.post(
            self.login_url,
            {
                "username": "loginuser",
                "password": "TestPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_protected_route_requires_authentication(self):
        response = self.client.get(self.me_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )