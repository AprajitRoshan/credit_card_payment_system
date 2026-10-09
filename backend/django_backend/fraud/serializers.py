from rest_framework import serializers

from cards.models import Card

from .models import FraudLog


class FraudLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )
    email = serializers.CharField(
        source="user.email",
        read_only=True,
    )
    rules = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )
    reviewed_by_username = serializers.CharField(
        source="reviewed_by.username",
        read_only=True,
        default=None,
    )
    masked_card_number = serializers.SerializerMethodField()

    class Meta:
        model = FraudLog
        fields = [
            "id",
            "user_id",
            "username",
            "email",
            "transaction_id",
            "payment_id",
            "card_id",
            "masked_card_number",
            "amount",
            "rules",
            "device_id",
            "location_id",
            "alert_sent",
            "review_status",
            "reviewed_by_username",
            "reviewed_at",
            "review_notes",
            "created_at",
        ]

    def get_masked_card_number(self, obj):
        card_map = self.context.get("card_map")

        if card_map is not None:
            return card_map.get(obj.card_id)

        card = Card.objects.filter(id=obj.card_id).first()
        return card.masked_card_number if card else None


class FraudReviewSerializer(serializers.Serializer):
    review_status = serializers.ChoiceField(
        choices=[
            FraudLog.OPEN,
            FraudLog.CONFIRMED,
            FraudLog.FALSE_POSITIVE,
        ]
    )
    review_notes = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
    )
