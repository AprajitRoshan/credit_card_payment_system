from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import app
from app.models.fraud_log import FraudLog
from app.models.payment import Payment
from app.models.transaction import Transaction
from app.services.fraud_service import utc_now
from tests.conftest import CARD_ID, USER_ID


client = TestClient(app)


def pay(amount, device_id=None, location_id=None):
    created = client.post(
        f"/api/payments/?user_id={USER_ID}",
        json={
            "amount": amount,
            "card_id": CARD_ID,
            "device_id": device_id,
            "location_id": location_id,
        },
    )
    assert created.status_code == 201

    processed = client.post(f"/api/payments/{created.json()['id']}/process")
    assert processed.status_code == 200

    return processed.json()


def test_single_normal_payment_is_clear(notifications):
    result = pay(500)

    assert result["fraud_status"] == "CLEAR"
    assert notifications["fraud"] == []


def test_single_high_value_payment_alerts_but_is_not_fraud(notifications):
    result = pay(8000)

    assert result["fraud_status"] == "CLEAR"
    assert notifications["transaction"] == [(USER_ID, 8000.0)]
    assert notifications["fraud"] == []


def test_multiple_high_value_payments_flagged(db, notifications):
    pay(6000)
    result = pay(9000)

    assert result["fraud_status"] == "FLAGGED"
    assert "MULTIPLE_HIGH_VALUE_TRANSACTIONS" in result["fraud_reasons"]
    assert result["fraud_reasons"][0] == "HIGH_VALUE_TRANSACTION"

    # Fraud log stored with alert flag
    log = db.query(FraudLog).one()
    assert log.payment_id == result["id"]
    assert log.review_status == "OPEN"
    assert log.alert_sent is True
    assert "MULTIPLE_HIGH_VALUE_TRANSACTIONS" in log.rules_triggered

    # Transaction carries the fraud status
    transaction = db.query(Transaction).filter_by(payment_id=result["id"]).one()
    assert transaction.fraud_status == "FLAGGED"
    assert log.transaction_id == transaction.id

    # Email alert triggered with a readable reason
    assert len(notifications["fraud"]) == 1
    assert "high-value" in notifications["fraud"][0][2]


def test_rapid_transactions_flagged(db):
    pay(100)
    pay(200)
    result = pay(300)

    assert result["fraud_status"] == "FLAGGED"
    assert result["fraud_reasons"] == ["RAPID_REPEATED_TRANSACTIONS"]
    assert db.query(FraudLog).count() == 1


def test_different_device_flagged():
    pay(100, device_id="laptop-1")
    result = pay(100, device_id="phone-9")

    assert result["fraud_status"] == "FLAGGED"
    assert "DIFFERENT_DEVICE_IN_SHORT_WINDOW" in result["fraud_reasons"]


def test_different_location_flagged():
    pay(100, location_id="Asia/Kolkata")
    result = pay(100, location_id="Europe/London")

    assert result["fraud_status"] == "FLAGGED"
    assert "DIFFERENT_LOCATION_IN_SHORT_WINDOW" in result["fraud_reasons"]


def test_same_device_and_location_not_flagged():
    pay(100, device_id="laptop-1", location_id="Asia/Kolkata")
    result = pay(100, device_id="laptop-1", location_id="Asia/Kolkata")

    assert result["fraud_status"] == "CLEAR"


def test_old_payments_outside_window_ignored(db):
    pay(6000)

    # Move the earlier payment 30 minutes into the past.
    old = db.query(Payment).one()
    old.created_at = utc_now() - timedelta(minutes=30)
    db.commit()

    result = pay(9000)

    assert result["fraud_status"] == "CLEAR"


def test_fraud_alert_failure_keeps_log(db, monkeypatch):
    from app.services import payment_service

    monkeypatch.setattr(
        payment_service,
        "send_fraud_alert",
        lambda **kwargs: False,
    )

    pay(6000)
    pay(7000)

    log = db.query(FraudLog).one()
    assert log.alert_sent is False
