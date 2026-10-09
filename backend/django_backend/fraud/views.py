import logging

from django.utils import timezone

from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import CanViewAdminData, CanReviewFraud
from admin_panel.models import AdminLog
from cards.models import Card
from transactions.views import safe_parse_date

from .models import FraudLog
from .serializers import FraudLogSerializer, FraudReviewSerializer


logger = logging.getLogger("fraud")


class FraudLogPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "limit"
    max_page_size = 100


class FraudLogListView(generics.ListAPIView):
    """
    GET /api/fraud/logs/

    Admin, Support and Read-Only roles can review fraud logs.

    Filters: review_status, rule, user_id, start_date, end_date
    """

    serializer_class = FraudLogSerializer
    permission_classes = [CanViewAdminData]
    pagination_class = FraudLogPagination

    def get_queryset(self):
        params = self.request.query_params

        queryset = FraudLog.objects.select_related(
            "user",
            "reviewed_by",
        )

        review_status = params.get("review_status")
        rule = params.get("rule")
        user_id = params.get("user_id")
        start_date = params.get("start_date")
        end_date = params.get("end_date")

        if review_status:
            valid = {
                value for value, _ in FraudLog.REVIEW_STATUS_CHOICES
            }
            review_status = review_status.upper()

            if review_status not in valid:
                raise ValidationError({
                    "review_status": (
                        "Use OPEN, CONFIRMED_FRAUD or FALSE_POSITIVE."
                    )
                })

            queryset = queryset.filter(review_status=review_status)

        if rule:
            queryset = queryset.filter(
                rules_triggered__icontains=rule.upper()
            )

        if user_id:
            if not user_id.isdigit():
                raise ValidationError({"user_id": "Must be a number."})

            queryset = queryset.filter(user_id=int(user_id))

        for name, value, lookup in (
            ("start_date", start_date, "created_at__date__gte"),
            ("end_date", end_date, "created_at__date__lte"),
        ):
            if value:
                parsed = safe_parse_date(value)

                if parsed is None:
                    raise ValidationError({name: "Use YYYY-MM-DD."})

                queryset = queryset.filter(**{lookup: parsed})

        return queryset.order_by("-created_at")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        # Resolve masked card numbers in one query for the page.
        card_ids = {log.card_id for log in page}
        card_map = dict(
            Card.objects.filter(id__in=card_ids).values_list(
                "id",
                "masked_card_number",
            )
        )

        serializer = self.get_serializer(
            page,
            many=True,
            context={
                "request": request,
                "card_map": card_map,
            },
        )

        response = self.get_paginated_response(serializer.data)
        response.data["open_count"] = FraudLog.objects.filter(
            review_status=FraudLog.OPEN
        ).count()

        return response


class FraudLogReviewView(APIView):
    """
    PATCH /api/fraud/logs/<id>/review/

    Admin and Support roles can mark a fraud log as reviewed.
    """

    permission_classes = [CanReviewFraud]

    def patch(self, request, log_id):
        try:
            fraud_log = FraudLog.objects.select_related(
                "user",
                "reviewed_by",
            ).get(id=log_id)
        except FraudLog.DoesNotExist:
            return Response(
                {"detail": "Fraud log not found."},
                status=404,
            )

        serializer = FraudReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = fraud_log.review_status

        fraud_log.review_status = (
            serializer.validated_data["review_status"]
        )
        fraud_log.review_notes = serializer.validated_data.get(
            "review_notes",
            fraud_log.review_notes,
        )

        if fraud_log.review_status == FraudLog.OPEN:
            fraud_log.reviewed_by = None
            fraud_log.reviewed_at = None
        else:
            fraud_log.reviewed_by = request.user
            fraud_log.reviewed_at = timezone.now()

        fraud_log.save()

        AdminLog.objects.create(
            admin_user=request.user,
            action="REVIEW_FRAUD",
            target=f"FraudLog {fraud_log.id}",
            details={
                "payment_id": fraud_log.payment_id,
                "old_review_status": old_status,
                "new_review_status": fraud_log.review_status,
            },
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        logger.info(
            "Fraud log %s reviewed by %s: %s -> %s",
            fraud_log.id,
            request.user.username,
            old_status,
            fraud_log.review_status,
        )

        return Response(FraudLogSerializer(fraud_log).data)
