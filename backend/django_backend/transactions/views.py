import re

from django.utils.dateparse import parse_date

from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated

from cards.models import Card
from .models import Transaction
from .serializers import TransactionSerializer


def safe_parse_date(value):
    """
    parse_date() returns None for badly formatted input but raises
    ValueError for well-formed invalid dates such as 2026-13-40.
    """
    try:
        return parse_date(value)
    except ValueError:
        return None


class TransactionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "limit"
    max_page_size = 100


class TransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = TransactionPagination
    filter_backends = [OrderingFilter]
    ordering_fields = ["created_at", "amount", "status", "id"]
    ordering = ["-created_at"]

    def get_queryset(self):
        params = self.request.query_params

        queryset = Transaction.objects.filter(
            user=self.request.user
        )

        status_value = params.get("status")
        min_amount = params.get("min_amount")
        max_amount = params.get("max_amount")
        date = params.get("date")
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        card_number = params.get("card_number")
        fraud_status = params.get("fraud_status")
        category = params.get("category")

        if status_value:
            valid_statuses = {
                value for value, _ in Transaction.STATUS_CHOICES
            }
            status_value = status_value.upper()

            if status_value not in valid_statuses:
                raise ValidationError({
                    "status": "Use PENDING, SUCCESS, or FAILED."
                })

            queryset = queryset.filter(status=status_value)

        try:
            if min_amount is not None:
                min_value = float(min_amount)
                if min_value < 0:
                    raise ValueError
                queryset = queryset.filter(amount__gte=min_value)

            if max_amount is not None:
                max_value = float(max_amount)
                if max_value < 0:
                    raise ValueError
                queryset = queryset.filter(amount__lte=max_value)

            if (
                min_amount is not None
                and max_amount is not None
                and float(min_amount) > float(max_amount)
            ):
                raise ValidationError({
                    "detail": "min_amount cannot exceed max_amount."
                })

        except ValueError:
            raise ValidationError({
                "detail": "Amount filters must be non-negative numbers."
            })

        if date:
            parsed_date = safe_parse_date(date)
            if parsed_date is None:
                raise ValidationError({
                    "date": "Use YYYY-MM-DD."
                })
            queryset = queryset.filter(created_at__date=parsed_date)

        if start_date:
            parsed_start = safe_parse_date(start_date)
            if parsed_start is None:
                raise ValidationError({
                    "start_date": "Use YYYY-MM-DD."
                })
            queryset = queryset.filter(
                created_at__date__gte=parsed_start
            )

        if end_date:
            parsed_end = safe_parse_date(end_date)
            if parsed_end is None:
                raise ValidationError({
                    "end_date": "Use YYYY-MM-DD."
                })
            queryset = queryset.filter(
                created_at__date__lte=parsed_end
            )

        if start_date and end_date and parsed_start > parsed_end:
            raise ValidationError({
                "detail": "start_date cannot be after end_date."
            })

        if fraud_status:
            valid_fraud = {
                value for value, _ in Transaction.FRAUD_STATUS_CHOICES
            }
            fraud_status = fraud_status.upper()

            if fraud_status not in valid_fraud:
                raise ValidationError({
                    "fraud_status": "Use CLEAR or FLAGGED."
                })

            queryset = queryset.filter(fraud_status=fraud_status)

        if category:
            valid_categories = {
                value for value, _ in Transaction.CATEGORY_CHOICES
            }
            category = category.upper()

            if category not in valid_categories:
                raise ValidationError({
                    "category": "Invalid category."
                })

            queryset = queryset.filter(category=category)

        if card_number:
            # Accept "1111", "**** 1111" or "************1111".
            # Full card numbers are never stored, so only the visible
            # trailing digits can be matched.
            digits = re.sub(r"\D", "", card_number)

            if not digits:
                raise ValidationError({
                    "card_number": "Enter the last digits of the card."
                })

            matching_card_ids = Card.objects.filter(
                user=self.request.user,
                masked_card_number__endswith=digits[-4:],
            ).values_list("id", flat=True)

            queryset = queryset.filter(card_id__in=matching_card_ids)

        return queryset.order_by("-created_at")