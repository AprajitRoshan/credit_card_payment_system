from calendar import monthrange
from datetime import datetime

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
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

from cards.models import Card
from transactions.models import Transaction

from .pdf_fonts import register_pdf_fonts


User = get_user_model()


class MonthlyStatementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # ---------------------------------------------------------
        # VALIDATE MONTH AND YEAR
        # ---------------------------------------------------------

        try:
            month = int(request.query_params.get("month"))
            year = int(request.query_params.get("year"))
        except (TypeError, ValueError):
            return HttpResponse(
                "Please provide a valid month and year.",
                status=400,
            )

        if month < 1 or month > 12:
            return HttpResponse(
                "Month must be between 1 and 12.",
                status=400,
            )

        if year < 2000 or year > 2100:
            return HttpResponse(
                "Please provide a valid year.",
                status=400,
            )

        # ---------------------------------------------------------
        # DATE RANGE
        # ---------------------------------------------------------

        start_date = timezone.make_aware(
            datetime(year, month, 1)
        )

        last_day = monthrange(year, month)[1]

        end_date = timezone.make_aware(
            datetime(
                year,
                month,
                last_day,
                23,
                59,
                59,
            )
        )

        # ---------------------------------------------------------
        # GET USER TRANSACTIONS
        # ---------------------------------------------------------

        transactions = (
            Transaction.objects
            .filter(
                user=request.user,
                created_at__gte=start_date,
                created_at__lte=end_date,
            )
            .order_by("-created_at")
        )

        # ---------------------------------------------------------
        # GET USER CARDS
        # ---------------------------------------------------------

        cards = (
            Card.objects
            .filter(user=request.user)
            .order_by("id")
        )

        card_map = {
            card.id: card
            for card in cards
        }

        # ---------------------------------------------------------
        # MONTHLY SUMMARY
        # ---------------------------------------------------------

        total_spending = sum(
            transaction.amount
            for transaction in transactions
            if transaction.status == "SUCCESS"
        )

        successful_count = sum(
            1
            for transaction in transactions
            if transaction.status == "SUCCESS"
        )

        failed_count = sum(
            1
            for transaction in transactions
            if transaction.status == "FAILED"
        )

        pending_count = sum(
            1
            for transaction in transactions
            if transaction.status == "PENDING"
        )

        # ---------------------------------------------------------
        # PDF RESPONSE
        # ---------------------------------------------------------

        response = HttpResponse(
            content_type="application/pdf"
        )

        response[
            "Content-Disposition"
        ] = (
            f'attachment; filename="monthly_statement_'
            f'{year}_{month:02d}.pdf"'
        )

        # ---------------------------------------------------------
        # PDF DOCUMENT
        # ---------------------------------------------------------

        document = SimpleDocTemplate(
            response,
            pagesize=A4,
            rightMargin=18 * mm,
            leftMargin=18 * mm,
            topMargin=18 * mm,
            bottomMargin=18 * mm,
        )

        # ---------------------------------------------------------
        # FONTS (cross-platform, see statements/pdf_fonts.py)
        # ---------------------------------------------------------

        regular_font, bold_font, RUPEE_SYMBOL = register_pdf_fonts()

        def rupee(amount):
            return f"{RUPEE_SYMBOL}{amount:,.2f}"

        # ---------------------------------------------------------
        # STYLES
        # ---------------------------------------------------------

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "StatementTitle",
            parent=styles["Title"],
            fontName=bold_font,
            fontSize=20,
            leading=24,
            alignment=TA_LEFT,
            spaceAfter=4,
        )

        subtitle_style = ParagraphStyle(
            "StatementSubtitle",
            parent=styles["Normal"],
            fontName=regular_font,
            fontSize=9,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=12,
        )

        section_style = ParagraphStyle(
            "SectionTitle",
            parent=styles["Heading2"],
            fontName=bold_font,
            fontSize=11,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=10,
            spaceAfter=6,
        )

        normal_style = ParagraphStyle(
            "NormalStatement",
            parent=styles["Normal"],
            fontName=regular_font,
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155"),
        )

        right_style = ParagraphStyle(
            "RightStatement",
            parent=normal_style,
            alignment=TA_RIGHT,
        )

        story = []

        # ---------------------------------------------------------
        # HEADER
        # ---------------------------------------------------------

        story.append(
            Paragraph(
                "CREDIT CARD STATEMENT",
                title_style,
            )
        )

        story.append(
            Paragraph(
                f"Statement Period: "
                f"{start_date.strftime('%B %Y')}",
                subtitle_style,
            )
        )

        # ---------------------------------------------------------
        # CUSTOMER INFORMATION
        # ---------------------------------------------------------

        customer_data = [
            [
                Paragraph(
                    "<b>Customer</b>",
                    normal_style,
                ),
                Paragraph(
                    request.user.username,
                    normal_style,
                ),
                Paragraph(
                    "<b>Email</b>",
                    normal_style,
                ),
                Paragraph(
                    request.user.email,
                    normal_style,
                ),
            ],
        ]

        customer_table = Table(
            customer_data,
            colWidths=[
                28 * mm,
                55 * mm,
                25 * mm,
                60 * mm,
            ],
        )

        customer_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        colors.HexColor("#f8fafc"),
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.HexColor("#e2e8f0"),
                    ),
                    (
                        "INNERGRID",
                        (0, 0),
                        (-1, -1),
                        0.25,
                        colors.HexColor("#e2e8f0"),
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                ]
            )
        )

        story.append(customer_table)
        story.append(Spacer(1, 8))

        # ---------------------------------------------------------
        # CARD DETAILS
        # ---------------------------------------------------------

        story.append(
            Paragraph(
                "CARD DETAILS",
                section_style,
            )
        )

        if cards:
            card_rows = [
                [
                    Paragraph(
                        "<b>Card</b>",
                        normal_style,
                    ),
                    Paragraph(
                        "<b>Type</b>",
                        normal_style,
                    ),
                    Paragraph(
                        "<b>Credit Limit</b>",
                        right_style,
                    ),
                    Paragraph(
                        "<b>Status</b>",
                        normal_style,
                    ),
                ]
            ]

            for card in cards:
                card_status = (
                    "Blocked"
                    if card.is_blocked
                    else "Active"
                )

                card_rows.append(
                    [
                        Paragraph(
                            card.masked_card_number,
                            normal_style,
                        ),
                        Paragraph(
                            card.card_type,
                            normal_style,
                        ),
                        Paragraph(
                            rupee(card.credit_limit),
                            right_style,
                        ),
                        Paragraph(
                            card_status,
                            normal_style,
                        ),
                    ]
                )

            card_table = Table(
                card_rows,
                colWidths=[
                    55 * mm,
                    30 * mm,
                    45 * mm,
                    35 * mm,
                ],
                repeatRows=1,
            )

            card_table.setStyle(
                TableStyle(
                    [
                        (
                            "BACKGROUND",
                            (0, 0),
                            (-1, 0),
                            colors.HexColor("#0f172a"),
                        ),
                        (
                            "TEXTCOLOR",
                            (0, 0),
                            (-1, 0),
                            colors.white,
                        ),
                        (
                            "GRID",
                            (0, 0),
                            (-1, -1),
                            0.4,
                            colors.HexColor("#cbd5e1"),
                        ),
                        (
                            "ROWBACKGROUNDS",
                            (0, 1),
                            (-1, -1),
                            [
                                colors.white,
                                colors.HexColor("#f8fafc"),
                            ],
                        ),
                        (
                            "VALIGN",
                            (0, 0),
                            (-1, -1),
                            "MIDDLE",
                        ),
                        (
                            "LEFTPADDING",
                            (0, 0),
                            (-1, -1),
                            7,
                        ),
                        (
                            "RIGHTPADDING",
                            (0, 0),
                            (-1, -1),
                            7,
                        ),
                        (
                            "TOPPADDING",
                            (0, 0),
                            (-1, -1),
                            7,
                        ),
                        (
                            "BOTTOMPADDING",
                            (0, 0),
                            (-1, -1),
                            7,
                        ),
                    ]
                )
            )

            story.append(card_table)

        # ---------------------------------------------------------
        # MONTHLY SUMMARY
        # ---------------------------------------------------------

        story.append(
            Paragraph(
                "MONTHLY SUMMARY",
                section_style,
            )
        )

        summary_data = [
            [
                Paragraph(
                    "<b>Total Spending</b>",
                    normal_style,
                ),
                Paragraph(
                    f"<b>{rupee(total_spending)}</b>",
                    right_style,
                ),
            ],
            [
                Paragraph(
                    "Successful Transactions",
                    normal_style,
                ),
                Paragraph(
                    str(successful_count),
                    right_style,
                ),
            ],
            [
                Paragraph(
                    "Failed Transactions",
                    normal_style,
                ),
                Paragraph(
                    str(failed_count),
                    right_style,
                ),
            ],
            [
                Paragraph(
                    "Pending Transactions",
                    normal_style,
                ),
                Paragraph(
                    str(pending_count),
                    right_style,
                ),
            ],
            [
                Paragraph(
                    "Total Transactions",
                    normal_style,
                ),
                Paragraph(
                    str(len(transactions)),
                    right_style,
                ),
            ],
        ]

        summary_table = Table(
            summary_data,
            colWidths=[
                100 * mm,
                65 * mm,
            ],
        )

        summary_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#eff6ff"),
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.HexColor("#cbd5e1"),
                    ),
                    (
                        "INNERGRID",
                        (0, 0),
                        (-1, -1),
                        0.25,
                        colors.HexColor("#e2e8f0"),
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                ]
            )
        )

        story.append(summary_table)

        # ---------------------------------------------------------
        # TRANSACTION DETAILS
        # ---------------------------------------------------------

        story.append(
            Paragraph(
                "TRANSACTION DETAILS",
                section_style,
            )
        )

        transaction_rows = [
            [
                Paragraph(
                    "<b>Date</b>",
                    normal_style,
                ),
                Paragraph(
                    "<b>ID</b>",
                    normal_style,
                ),
                Paragraph(
                    "<b>Card</b>",
                    normal_style,
                ),
                Paragraph(
                    "<b>Amount</b>",
                    right_style,
                ),
                Paragraph(
                    "<b>Status</b>",
                    normal_style,
                ),
            ]
        ]

        for transaction in transactions:
            card = card_map.get(transaction.card_id)

            card_number = (
                card.masked_card_number
                if card
                else "N/A"
            )

            transaction_rows.append(
                [
                    Paragraph(
                        transaction.created_at.strftime(
                            "%d %b %Y"
                        ),
                        normal_style,
                    ),
                    Paragraph(
                        str(transaction.id),
                        normal_style,
                    ),
                    Paragraph(
                        card_number,
                        normal_style,
                    ),
                    Paragraph(
                        rupee(transaction.amount),
                        right_style,
                    ),
                    Paragraph(
                        transaction.status,
                        normal_style,
                    ),
                ]
            )

        if len(transaction_rows) == 1:
            transaction_rows.append(
                [
                    Paragraph(
                        "No transactions",
                        normal_style,
                    ),
                    "",
                    "",
                    "",
                    "",
                ]
            )

        transaction_table = Table(
            transaction_rows,
            colWidths=[
                30 * mm,
                15 * mm,
                55 * mm,
                30 * mm,
                25 * mm,
            ],
            repeatRows=1,
        )

        transaction_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#0f172a"),
                    ),
                    (
                        "TEXTCOLOR",
                        (0, 0),
                        (-1, 0),
                        colors.white,
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.4,
                        colors.HexColor("#cbd5e1"),
                    ),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [
                            colors.white,
                            colors.HexColor("#f8fafc"),
                        ],
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        5,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        5,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                ]
            )
        )

        story.append(transaction_table)
        story.append(Spacer(1, 12))

        # ---------------------------------------------------------
        # FOOTER
        # ---------------------------------------------------------

        story.append(
            Paragraph(
                "This statement is generated electronically "
                "by the Credit Card Payment System.",
                subtitle_style,
            )
        )

        # ---------------------------------------------------------
        # BUILD PDF
        # ---------------------------------------------------------

        document.build(story)

        return response