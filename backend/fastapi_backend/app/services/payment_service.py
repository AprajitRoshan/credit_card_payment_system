import random

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.models.transaction import Transaction
from app.schemas.payment import PaymentCreate


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

    # Simulate payment processing
    payment.status = random.choice(
        ["SUCCESS", "FAILED"]
    )

    # Create Django transaction record
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
    db.refresh(payment)

    return payment