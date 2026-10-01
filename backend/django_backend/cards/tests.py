from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from cards.models import Card


User = get_user_model()


class CardManagementTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="cardtestuser",
            email="cardtest@example.com",
            password="TestPassword123!",
        )

        self.client.force_authenticate(user=self.user)

        self.cards_url = "/api/cards/"

        self.card_data = {
            "card_type": "CREDIT",
            "card_holder_name": "Card Test User",
            "card_number": "4111111111111111",
            "expiry_month": 12,
            "expiry_year": 2030,
            "cvv": "123",
        }

    def test_add_card(self):
        response = self.client.post(
            self.cards_url,
            self.card_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            Card.objects.filter(user=self.user).count(),
            1,
        )

    def test_saved_card_does_not_store_full_card_number(self):
        self.client.post(
            self.cards_url,
            self.card_data,
            format="json",
        )

        card = Card.objects.get(user=self.user)

        self.assertNotIn(
            "4111111111111111",
            card.masked_card_number,
        )

        self.assertEqual(
            card.last_four_digits,
            "1111",
        )

    def test_view_saved_cards(self):
        self.client.post(
            self.cards_url,
            self.card_data,
            format="json",
        )

        response = self.client.get(self.cards_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(len(response.data), 1)

    def test_delete_card(self):
        response = self.client.post(
            self.cards_url,
            self.card_data,
            format="json",
        )

        card_id = response.data["id"]

        delete_response = self.client.delete(
            f"{self.cards_url}{card_id}/"
        )

        self.assertEqual(
            delete_response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Card.objects.filter(id=card_id).exists()
        )