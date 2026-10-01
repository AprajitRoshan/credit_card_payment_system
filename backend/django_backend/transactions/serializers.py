from rest_framework import serializers

from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id",
            "payment_id",
            "card_id",
            "amount",
            "currency",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]