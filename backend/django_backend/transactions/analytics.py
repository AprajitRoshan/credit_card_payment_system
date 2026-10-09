import csv
from datetime import datetime

from django.db.models import Count, Sum, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from admin_panel.models import AdminLog
from cards.models import Card
from statements.pdf_fonts import register_pdf_fonts
from transactions.models import Transaction


TREND_MONTHS = 6


# ---------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------

def parse_month_year(query_params):
    """
    Returns (month, year, error_message).
    Defaults to the current month when not provided.
    """
    try:
        month = int(
            query_params.get("month", timezone.localdate().month)
        )
        year = int(
            query_params.get("year", timezone.localdate().year)
        )
    except (TypeError, ValueError):
        return None, None, "month and year must be integers."

    if not 1 <= month <= 12 or not 2000 <= year <= 2100:
        return None, None, "Provide a valid month and year."

    return month, year, None


def month_range(year, month):
    start = timezone.make_aware(datetime(year, month, 1))

    if month == 12:
        end = timezone.make_aware(datetime(year + 1, 1, 1))
    else:
        end = timezone.make_aware(datetime(year, month + 1, 1))

    return start, end


def shift_month(year, month, offset):
    """Move (year, month) by offset months (negative = backwards)."""
    index = year * 12 + (month - 1) + offset
    return index // 12, index % 12 + 1


# ---------------------------------------------------------------------
# ANALYTICS BUILDER (shared by the JSON API and the exports)
# ---------------------------------------------------------------------

def build_analytics(user, month, year):
    start_date, end_date = month_range(year, month)

    transactions = Transaction.objects.filter(
        user=user,
        created_at__gte=start_date,
        created_at__lt=end_date,
    )

    summary = transactions.aggregate(
        total_spending=Sum("amount", filter=Q(status="SUCCESS")),
        successful=Count("id", filter=Q(status="SUCCESS")),
        failed=Count("id", filter=Q(status="FAILED")),
        pending=Count("id", filter=Q(status="PENDING")),
        flagged=Count("id", filter=Q(fraud_status="FLAGGED")),
    )

    # Category-wise spending for successful transactions
    category_summary = (
        transactions.filter(status="SUCCESS")
        .values("category")
        .annotate(total=Sum("amount"), count=Count("id"))
        .order_by("-total")
    )

    category_expenses = [
        {
            "category": item["category"],
            "amount": round(float(item["total"] or 0), 2),
            "count": item["count"],
        }
        for item in category_summary
    ]

    # Monthly spending trend (last TREND_MONTHS months up to selected)
    monthly_trend = []

    for offset in range(-(TREND_MONTHS - 1), 1):
        trend_year, trend_month = shift_month(year, month, offset)
        trend_start, trend_end = month_range(trend_year, trend_month)

        trend = Transaction.objects.filter(
            user=user,
            created_at__gte=trend_start,
            created_at__lt=trend_end,
        ).aggregate(
            total=Sum("amount", filter=Q(status="SUCCESS")),
            count=Count("id"),
        )

        monthly_trend.append({
            "month": trend_month,
            "year": trend_year,
            "label": trend_start.strftime("%b %Y"),
            "spending": round(float(trend["total"] or 0), 2),
            "transactions": trend["count"],
        })

    # Credit utilization by card
    cards = Card.objects.filter(user=user).order_by("id")

    card_usage = dict(
        Transaction.objects.filter(user=user, status="SUCCESS")
        .values("card_id")
        .annotate(total=Sum("amount"))
        .values_list("card_id", "total")
    )

    card_data = []
    total_limit = 0.0
    total_used = 0.0

    for card in cards:
        limit = float(card.credit_limit or 0)
        used = float(card_usage.get(card.id) or 0)
        utilization = (used / limit) * 100 if limit > 0 else 0

        total_limit += limit
        total_used += used

        card_data.append({
            "card_id": card.id,
            "masked_card_number": card.masked_card_number,
            "credit_limit": round(limit, 2),
            "used_credit": round(used, 2),
            "available_credit": round(max(limit - used, 0), 2),
            "utilization_percentage": round(utilization, 2),
        })

    return {
        "month": month,
        "year": year,
        "period_label": start_date.strftime("%B %Y"),
        "monthly_spending": round(
            float(summary["total_spending"] or 0), 2
        ),
        "transaction_counts": {
            "successful": summary["successful"],
            "failed": summary["failed"],
            "pending": summary["pending"],
            "flagged": summary["flagged"],
        },
        "category_expenses": category_expenses,
        "monthly_trend": monthly_trend,
        "credit_utilization": {
            "total_limit": round(total_limit, 2),
            "total_used": round(total_used, 2),
            "percentage": round(
                total_used / total_limit * 100 if total_limit > 0 else 0,
                2,
            ),
        },
        "cards": card_data,
    }


# ---------------------------------------------------------------------
# JSON API
# ---------------------------------------------------------------------

class TransactionAnalyticsView(APIView):
    """
    GET /api/transactions/analytics/?month=10&year=2026
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        month, year, error = parse_month_year(request.query_params)

        if error:
            return Response({"detail": error}, status=400)

        return Response(build_analytics(request.user, month, year))


# ---------------------------------------------------------------------
# EXPORT (CSV / PDF)
# ---------------------------------------------------------------------

class AnalyticsExportView(APIView):
    """
    GET /api/transactions/analytics/export/csv/?month=10&year=2026
    GET /api/transactions/analytics/export/pdf/?month=10&year=2026
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, file_format):
        file_format = file_format.lower()

        if file_format not in {"csv", "pdf"}:
            return Response(
                {"detail": "Export format must be csv or pdf."},
                status=400,
            )

        month, year, error = parse_month_year(request.query_params)

        if error:
            return Response({"detail": error}, status=400)

        data = build_analytics(request.user, month, year)
        filename = f"analytics_summary_{year}_{month:02d}.{file_format}"

        if file_format == "csv":
            response = self._build_csv(data)
        else:
            response = self._build_pdf(request.user, data)

        response["Content-Disposition"] = (
            f'attachment; filename="{filename}"'
        )

        # Track admin-role exports in the audit log.
        role = getattr(getattr(request.user, "role", None), "name", None)

        if role in {"ADMIN", "SUPPORT", "READ_ONLY"}:
            AdminLog.objects.create(
                admin_user=request.user,
                action="EXPORT_ANALYTICS",
                target=filename,
                details={"format": file_format},
                ip_address=request.META.get("REMOTE_ADDR"),
            )

        return response

    # -----------------------------------------------------------------
    # CSV
    # -----------------------------------------------------------------

    @staticmethod
    def _build_csv(data):
        response = HttpResponse(content_type="text/csv")
        writer = csv.writer(response)

        writer.writerow(["Analytics Summary", data["period_label"]])
        writer.writerow([])

        writer.writerow(["Summary"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Monthly Spending (INR)", data["monthly_spending"]])

        counts = data["transaction_counts"]
        writer.writerow(["Successful Transactions", counts["successful"]])
        writer.writerow(["Failed Transactions", counts["failed"]])
        writer.writerow(["Pending Transactions", counts["pending"]])
        writer.writerow(["Flagged Transactions", counts["flagged"]])

        utilization = data["credit_utilization"]
        writer.writerow(["Total Credit Limit (INR)", utilization["total_limit"]])
        writer.writerow(["Total Credit Used (INR)", utilization["total_used"]])
        writer.writerow(["Credit Utilization (%)", utilization["percentage"]])
        writer.writerow([])

        writer.writerow(["Category Expenses"])
        writer.writerow(["Category", "Amount (INR)", "Transactions"])

        for item in data["category_expenses"]:
            writer.writerow([item["category"], item["amount"], item["count"]])

        writer.writerow([])

        writer.writerow(["Monthly Trend"])
        writer.writerow(["Month", "Spending (INR)", "Transactions"])

        for item in data["monthly_trend"]:
            writer.writerow([item["label"], item["spending"], item["transactions"]])

        writer.writerow([])

        writer.writerow(["Card Utilization"])
        writer.writerow([
            "Card",
            "Credit Limit (INR)",
            "Used (INR)",
            "Available (INR)",
            "Utilization (%)",
        ])

        for card in data["cards"]:
            writer.writerow([
                card["masked_card_number"],
                card["credit_limit"],
                card["used_credit"],
                card["available_credit"],
                card["utilization_percentage"],
            ])

        return response

    # -----------------------------------------------------------------
    # PDF
    # -----------------------------------------------------------------

    @staticmethod
    def _build_pdf(user, data):
        response = HttpResponse(content_type="application/pdf")

        document = SimpleDocTemplate(
            response,
            pagesize=A4,
            rightMargin=18 * mm,
            leftMargin=18 * mm,
            topMargin=18 * mm,
            bottomMargin=18 * mm,
            title=f"Analytics Summary {data['period_label']}",
        )

        regular_font, bold_font, currency = register_pdf_fonts()

        def money(value):
            return f"{currency}{value:,.2f}"

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "AnalyticsTitle",
            parent=styles["Title"],
            fontName=bold_font,
            fontSize=20,
            leading=24,
            alignment=0,
            spaceAfter=4,
        )

        subtitle_style = ParagraphStyle(
            "AnalyticsSubtitle",
            parent=styles["Normal"],
            fontName=regular_font,
            fontSize=9,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=12,
        )

        section_style = ParagraphStyle(
            "AnalyticsSection",
            parent=styles["Heading2"],
            fontName=bold_font,
            fontSize=11,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=12,
            spaceAfter=6,
        )

        normal_style = ParagraphStyle(
            "AnalyticsNormal",
            parent=styles["Normal"],
            fontName=regular_font,
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155"),
        )

        right_style = ParagraphStyle(
            "AnalyticsRight",
            parent=normal_style,
            alignment=TA_RIGHT,
        )

        def cell(text, right=False, bold=False):
            text = f"<b>{text}</b>" if bold else str(text)
            return Paragraph(text, right_style if right else normal_style)

        def styled_table(rows, col_widths, header=True):
            table = Table(rows, colWidths=col_widths, repeatRows=1 if header else 0)

            commands = [
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                (
                    "ROWBACKGROUNDS",
                    (0, 1 if header else 0),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8fafc")],
                ),
            ]

            if header:
                commands += [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ]

            table.setStyle(TableStyle(commands))
            return table

        def header_cell(text, right=False):
            style = ParagraphStyle(
                "HeaderCell",
                parent=right_style if right else normal_style,
                textColor=colors.white,
                fontName=bold_font,
            )
            return Paragraph(text, style)

        story = [
            Paragraph("CARD USAGE ANALYTICS", title_style),
            Paragraph(
                f"Period: {data['period_label']} &nbsp;&nbsp;|&nbsp;&nbsp; "
                f"Customer: {user.username} &nbsp;&nbsp;|&nbsp;&nbsp; "
                f"Generated: {timezone.now().strftime('%d %b %Y %H:%M UTC')}",
                subtitle_style,
            ),
        ]

        # Summary
        counts = data["transaction_counts"]
        utilization = data["credit_utilization"]

        story.append(Paragraph("SUMMARY", section_style))
        story.append(styled_table(
            [
                [cell("Monthly Spending", bold=True), cell(money(data["monthly_spending"]), right=True, bold=True)],
                [cell("Successful Transactions"), cell(counts["successful"], right=True)],
                [cell("Failed Transactions"), cell(counts["failed"], right=True)],
                [cell("Pending Transactions"), cell(counts["pending"], right=True)],
                [cell("Flagged by Fraud Detection"), cell(counts["flagged"], right=True)],
                [cell("Total Credit Limit"), cell(money(utilization["total_limit"]), right=True)],
                [cell("Total Credit Used"), cell(money(utilization["total_used"]), right=True)],
                [cell("Credit Utilization", bold=True), cell(f"{utilization['percentage']:.2f}%", right=True, bold=True)],
            ],
            [100 * mm, 74 * mm],
            header=False,
        ))

        # Category expenses
        story.append(Paragraph("CATEGORY-WISE EXPENSES", section_style))

        category_rows = [[
            header_cell("Category"),
            header_cell("Transactions", right=True),
            header_cell("Amount", right=True),
        ]]

        for item in data["category_expenses"]:
            category_rows.append([
                cell(item["category"].title()),
                cell(item["count"], right=True),
                cell(money(item["amount"]), right=True),
            ])

        if len(category_rows) == 1:
            category_rows.append([cell("No successful spending"), "", ""])

        story.append(styled_table(category_rows, [80 * mm, 44 * mm, 50 * mm]))

        # Monthly trend
        story.append(Paragraph("MONTHLY SPENDING TREND", section_style))

        trend_rows = [[
            header_cell("Month"),
            header_cell("Transactions", right=True),
            header_cell("Spending", right=True),
        ]]

        for item in data["monthly_trend"]:
            trend_rows.append([
                cell(item["label"]),
                cell(item["transactions"], right=True),
                cell(money(item["spending"]), right=True),
            ])

        story.append(styled_table(trend_rows, [80 * mm, 44 * mm, 50 * mm]))

        # Card utilization
        story.append(Paragraph("CREDIT UTILIZATION BY CARD", section_style))

        card_rows = [[
            header_cell("Card"),
            header_cell("Limit", right=True),
            header_cell("Used", right=True),
            header_cell("Available", right=True),
            header_cell("Usage", right=True),
        ]]

        for card in data["cards"]:
            card_rows.append([
                cell(card["masked_card_number"]),
                cell(money(card["credit_limit"]), right=True),
                cell(money(card["used_credit"]), right=True),
                cell(money(card["available_credit"]), right=True),
                cell(f"{card['utilization_percentage']:.1f}%", right=True),
            ])

        if len(card_rows) == 1:
            card_rows.append([cell("No cards"), "", "", "", ""])

        story.append(styled_table(
            card_rows,
            [50 * mm, 32 * mm, 32 * mm, 32 * mm, 28 * mm],
        ))

        story.append(Spacer(1, 12))
        story.append(Paragraph(
            "This analytics summary is generated electronically "
            "by the Credit Card Payment System.",
            subtitle_style,
        ))

        document.build(story)

        return response
