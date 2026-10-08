import random

from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.models.transaction import Transaction
from app.schemas.payment import PaymentCreate
from app.services.notification_service import (
    send_transaction_alert,
)
from app.services.credit_limit_notification import (
    send_credit_limit_alert,
)


def create_payment(
    db: Session,
    payment_data: PaymentCreate,
    user_id: int,
) -> Payment:

    payment = Payment(
        user_id=user_id,
        card_id=payment_data.card_id,
        amount=payment_data.amount,
        currency=payment_data.currency,
        status="PENDING",
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment


def process_payment(
    db: Session,
    payment_id: int,
) -> Payment:

    payment = db.query(Payment).filter(
        Payment.id == payment_id
    ).first()

    if not payment:
        raise ValueError("Payment not found.")

    if payment.status != "PENDING":
        raise ValueError(
            "Only PENDING payments can be processed."
        )

    # ---------------------------------------------------------
    # SIMULATE PAYMENT PROCESSING
    # ---------------------------------------------------------

    payment.status = random.choice(
        ["SUCCESS", "FAILED"]
    )

    # ---------------------------------------------------------
    # CREATE TRANSACTION RECORD
    # ---------------------------------------------------------

    transaction = Transaction(
        user_id=payment.user_id,
        payment_id=payment.id,
        card_id=payment.card_id,
        amount=payment.amount,
        currency=payment.currency,
        status=payment.status,
        created_at=datetime.now(timezone.utc),
    )

    db.add(transaction)
    db.commit()

    # ---------------------------------------------------------
    # TRANSACTION > ₹5,000 ALERT
    # ---------------------------------------------------------

    send_transaction_alert(
        user_id=payment.user_id,
        amount=float(payment.amount),
    )

    # ---------------------------------------------------------
    # LOW AVAILABLE CREDIT ALERT
    # ---------------------------------------------------------

    # Only successful transactions reduce
    # the available credit.

    if payment.status == "SUCCESS":

        # Get the credit limit for this card.
        card_result = db.execute(
            text("""
                SELECT credit_limit
                FROM cards_card
                WHERE id = :card_id
                  AND user_id = :user_id
                LIMIT 1
            """),
            {
                "card_id": payment.card_id,
                "user_id": payment.user_id,
            },
        ).mappings().first()

        if card_result:

            credit_limit = float(
                card_result["credit_limit"] or 0
            )

            # Calculate total successful spending
            # on this card.
            spending_result = db.execute(
                text("""
                    SELECT COALESCE(SUM(amount), 0)
                    FROM transactions_transaction
                    WHERE user_id = :user_id
                      AND card_id = :card_id
                      AND status = 'SUCCESS'
                """),
                {
                    "user_id": payment.user_id,
                    "card_id": payment.card_id,
                },
            ).scalar()

            successful_spending = float(
                spending_result or 0
            )

            # Calculate remaining credit.
            available_credit = (
                credit_limit - successful_spending
            )

            # Send email only when available credit
            # falls below 10%.
            send_credit_limit_alert(
                user_id=payment.user_id,
                available_credit=available_credit,
                credit_limit=credit_limit,
            )

    # ---------------------------------------------------------
    # REFRESH PAYMENT
    # ---------------------------------------------------------

    db.refresh(payment)

    return payment