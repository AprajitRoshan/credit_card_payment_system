from datetime import datetime, timedelta, timezone

import jwt
import requests
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text

from app.main import app
from app.schema_sync import sync_payment_schema
from app.services import notification_service
from tests.conftest import CARD_ID, USER_ID


client = TestClient(app)


def make_token(user_id=USER_ID, expired=False):
    exp = datetime.now(timezone.utc) + timedelta(
        minutes=-5 if expired else 5
    )
    return jwt.encode(
        {"user_id": user_id, "exp": exp},
        "test-jwt-secret-key-for-automated-tests",
        algorithm="HS256",
    )


# ---------------------------------------------------------------------
# DASHBOARD + JWT
# ---------------------------------------------------------------------

def test_dashboard_summary_with_valid_token():
    created = client.post(
        f"/api/payments/?user_id={USER_ID}",
        json={"amount": 100, "card_id": CARD_ID},
    )
    client.post(f"/api/payments/{created.json()['id']}/process")

    response = client.get(
        "/api/dashboard/summary",
        headers={"Authorization": f"Bearer {make_token()}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_transactions"] == 1
    assert len(data["last_5_transactions"]) == 1


def test_dashboard_rejects_expired_and_invalid_tokens():
    expired = client.get(
        "/api/dashboard/summary",
        headers={"Authorization": f"Bearer {make_token(expired=True)}"},
    )
    assert expired.status_code == 401

    invalid = client.get(
        "/api/dashboard/summary",
        headers={"Authorization": "Bearer not-a-token"},
    )
    assert invalid.status_code == 401


# ---------------------------------------------------------------------
# NOTIFICATION CLIENT
# ---------------------------------------------------------------------

class FakeResponse:
    def __init__(self, ok=True, payload=None):
        self.ok = ok
        self.status_code = 200 if ok else 500
        self._payload = payload or {}

    def json(self):
        return self._payload


def test_notification_posts_with_secret(monkeypatch):
    captured = {}

    def fake_post(url, json, headers, timeout):
        captured.update(url=url, json=json, headers=headers)
        return FakeResponse(payload={"sent": True})

    monkeypatch.setattr(notification_service.requests, "post", fake_post)

    assert notification_service.send_fraud_alert(1, 9000, "reason") is True
    assert captured["url"].endswith("/notifications/fraud-alert/")
    assert captured["headers"]["X-Internal-Secret"] == "test-secret"


def test_notification_thresholds(monkeypatch):
    monkeypatch.setattr(
        notification_service.requests,
        "post",
        lambda *a, **k: FakeResponse(payload={"sent": True}),
    )

    assert notification_service.send_transaction_alert(1, 100) is False
    assert notification_service.send_transaction_alert(1, 9000) is True
    assert notification_service.send_credit_limit_alert(1, 5000, 10000) is False
    assert notification_service.send_credit_limit_alert(1, 500, 10000) is True
    assert notification_service.send_credit_limit_alert(1, 0, 0) is False


def test_notification_failures_return_false(monkeypatch):
    def raise_error(*args, **kwargs):
        raise requests.ConnectionError("down")

    monkeypatch.setattr(notification_service.requests, "post", raise_error)
    assert notification_service.send_fraud_alert(1, 1, "x") is False

    monkeypatch.setattr(
        notification_service.requests,
        "post",
        lambda *a, **k: FakeResponse(ok=False),
    )
    assert notification_service.send_fraud_alert(1, 1, "x") is False


def test_notification_without_secret(monkeypatch):
    monkeypatch.delenv("INTERNAL_NOTIFICATION_SECRET")
    assert notification_service.send_fraud_alert(1, 1, "x") is False


# ---------------------------------------------------------------------
# SCHEMA SYNC
# ---------------------------------------------------------------------

def test_schema_sync_adds_missing_payment_columns(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'old.sqlite3'}")

    # Old payments table without device/location/category columns.
    with engine.begin() as connection:
        connection.execute(text(
            """
            CREATE TABLE payments (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                card_id INTEGER NOT NULL,
                amount FLOAT NOT NULL,
                currency VARCHAR(3) NOT NULL,
                status VARCHAR(20) NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            )
            """
        ))

    sync_payment_schema(engine)

    columns = {c["name"] for c in inspect(engine).get_columns("payments")}
    assert {"device_id", "location_id", "category"} <= columns

    # Running twice is safe.
    sync_payment_schema(engine)


def test_schema_sync_creates_table(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'new.sqlite3'}")

    sync_payment_schema(engine)

    assert "payments" in inspect(engine).get_table_names()
