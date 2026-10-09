from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def dashboard_summary(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Total transactions
    total_transactions = db.execute(
        text("""
            SELECT COUNT(*)
            FROM transactions_transaction
            WHERE user_id = :user_id
        """),
        {"user_id": user_id},
    ).scalar() or 0

    # Total amount spent
    total_amount_spent = db.execute(
        text("""
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions_transaction
            WHERE user_id = :user_id
              AND status = 'SUCCESS'
        """),
        {"user_id": user_id},
    ).scalar() or 0

    # Current month spending
    # Date-range comparison (instead of YEAR()/MONTH()) keeps the
    # query index-friendly and database-agnostic.
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    month_start = now.replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    if month_start.month == 12:
        next_month_start = month_start.replace(
            year=month_start.year + 1, month=1
        )
    else:
        next_month_start = month_start.replace(
            month=month_start.month + 1
        )

    current_month_spending = db.execute(
        text("""
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions_transaction
            WHERE user_id = :user_id
              AND status = 'SUCCESS'
              AND created_at >= :month_start
              AND created_at < :next_month_start
        """),
        {
            "user_id": user_id,
            "month_start": month_start,
            "next_month_start": next_month_start,
        },
    ).scalar() or 0

    # Get total credit limit for the user's credit cards
    credit_limit = db.execute(
        text("""
            SELECT COALESCE(SUM(credit_limit), 0)
            FROM cards_card
            WHERE user_id = :user_id
              AND card_type = 'CREDIT'
        """),
        {"user_id": user_id},
    ).scalar() or 0

    # Available credit = credit limit - successful spending
    available_credit_limit = (
        float(credit_limit) - float(total_amount_spent)
    )

    # Last 5 transactions with masked card number
    last_5_transactions = db.execute(
        text("""
            SELECT
                t.amount,
                c.masked_card_number,
                t.created_at,
                t.status
            FROM transactions_transaction t
            INNER JOIN cards_card c
                ON t.card_id = c.id
            WHERE t.user_id = :user_id
            ORDER BY t.created_at DESC
            LIMIT 5
        """),
        {"user_id": user_id},
    ).mappings().all()

    transactions = [
        {
            "amount": float(transaction["amount"]),
            "masked_card_number": transaction["masked_card_number"],
            "date": transaction["created_at"],
            "status": transaction["status"],
        }
        for transaction in last_5_transactions
    ]

    return {
        "total_transactions": total_transactions,
        "total_amount_spent": float(total_amount_spent),
        "current_month_spending": float(current_month_spending),
        "available_credit_limit": available_credit_limit,
        "last_5_transactions": transactions,
    }