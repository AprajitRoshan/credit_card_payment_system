
import random

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.models.transaction import Transaction
from app.schemas.payment import PaymentCreate
from app.services.fraud_service import (
    HIGH_VALUE_THRESHOLD,
    create_fraud_log,
    evaluate_fraud,
    utc_now,
)
from app.services.notification_service import (
    send_transaction_alert,
    send_fraud_alert,
    send_credit_limit_alert,
)


class PaymentError(Exception):
    """Base error with an HTTP status code for the route layer."""

    status_code = 400

    def __init__(self, detail):
        super().__init__(detail)
        self.detail = detail


class PaymentNotFoundError(PaymentError):
    status_code = 404


class CardNotFoundError(PaymentError):
    status_code = 404


class PaymentStateError(PaymentError):
    status_code = 400


class CardBlockedError(PaymentError):
    status_code = 400


def get_card(db: Session, card_id: int, user_id: int):
    return db.execute(
        text(
            """
            SELECT id, credit_limit, is_blocked
            FROM cards_card
            WHERE id = :card_id AND user_id = :user_id
            """
        ),
        {"card_id": card_id, "user_id": user_id},
    ).mappings().first()


def create_payment(
    db: Session,
    payment_data: PaymentCreate,
    user_id: int,
):
    card = get_card(db, payment_data.card_id, user_id)

    if not card:
        raise CardNotFoundError("Card not found for this user.")

    if card["is_blocked"]:
        raise CardBlockedError(
            "This card is blocked. Please contact support."
        )

    now = utc_now()

    payment = Payment(
        user_id=user_id,
        card_id=payment_data.card_id,
        amount=payment_data.amount,
        currency=payment_data.currency,
        category=payment_data.category,
        status="PENDING",
        device_id=payment_data.device_id,
        location_id=payment_data.location_id,
        created_at=now,
        updated_at=now,
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment


def process_payment(db: Session, payment_id: int):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise PaymentNotFoundError("Payment not found.")

    if payment.status != "PENDING":
        raise PaymentStateError("Payment has already been processed.")

    card = get_card(db, payment.card_id, payment.user_id)

    # ---------------------------------------------
    # FRAUD EVALUATION
    # ---------------------------------------------

    fraud_result = evaluate_fraud(db, payment)

    # ---------------------------------------------
    # PAYMENT OUTCOME
    # ---------------------------------------------

    if not card or card["is_blocked"]:
        # The card was removed or blocked after the payment was created.
        payment.status = "FAILED"
    else:
        # Keep the existing simulated payment outcome.
        payment.status = random.choice(["SUCCESS", "FAILED"])

    payment.updated_at = utc_now()

    transaction = Transaction(
        user_id=payment.user_id,
        payment_id=payment.id,
        card_id=payment.card_id,
        amount=payment.amount,
        currency=payment.currency,
        status=payment.status,
        category=payment.category or "OTHER",
        fraud_status=fraud_result.status,
        fraud_reason=fraud_result.reason_codes,
        created_at=utc_now(),
    )

    db.add(transaction)
    db.flush()

    fraud_log = None

    if fraud_result.is_flagged:
        fraud_log = create_fraud_log(
            db=db,
            payment=payment,
            transaction_id=transaction.id,
            result=fraud_result,
        )

    db.commit()
    db.refresh(payment)

    # ---------------------------------------------
    # NOTIFICATIONS (after commit, never block the payment)
    # ---------------------------------------------

    # Existing high-value transaction notification.
    if float(payment.amount) > HIGH_VALUE_THRESHOLD:
        send_transaction_alert(
            user_id=payment.user_id,
            amount=float(payment.amount),
        )

    # Alert on any flagged attempt and record whether it was sent.
    if fraud_log is not None:
        sent = send_fraud_alert(
            user_id=payment.user_id,
            amount=float(payment.amount),
            reason=fraud_result.description,
        )

        if sent:
            fraud_log.alert_sent = True
            db.commit()

    # Preserve the existing credit-limit alert behavior.
    if payment.status == "SUCCESS" and card:
        credit_limit = float(card["credit_limit"] or 0)

        used_result = db.execute(
            text(
                """
                SELECT COALESCE(SUM(amount), 0)
                FROM transactions_transaction
                WHERE card_id = :card_id
                  AND user_id = :user_id
                  AND status = 'SUCCESS'
                """
            ),
            {
                "card_id": payment.card_id,
                "user_id": payment.user_id,
            },
        ).scalar()

        used_credit = float(used_result or 0)
        available_credit = max(credit_limit - used_credit, 0)

        send_credit_limit_alert(
            user_id=payment.user_id,
            available_credit=available_credit,
            credit_limit=credit_limit,
        )

    # Exposed on the API response (not stored on the payments table).
    payment.fraud_status = fraud_result.status
    payment.fraud_reasons = fraud_result.rules

    return payment
