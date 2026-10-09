"""
Test setup for the FastAPI payment service.

Tests run against an isolated SQLite database instead of the real MySQL
database, and email notifications are mocked so no real emails are sent.
"""

import os
import tempfile

TEST_DB_PATH = os.path.join(tempfile.gettempdir(), "ccps_fastapi_test.sqlite3")

# Must be set before the app (and app.database) is imported.
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["INTERNAL_NOTIFICATION_SECRET"] = "test-secret"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key-for-automated-tests"

import pytest  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import api_request_log, fraud_log, payment, transaction  # noqa: E402,F401


USER_ID = 1
CARD_ID = 7
BLOCKED_CARD_ID = 8


@pytest.fixture(scope="session", autouse=True)
def create_schema():
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

    Base.metadata.create_all(bind=engine)

    with engine.begin() as connection:
        # Minimal copy of the Django-owned cards table.
        connection.execute(text(
            """
            CREATE TABLE IF NOT EXISTS cards_card (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                card_type VARCHAR(10) NOT NULL DEFAULT 'CREDIT',
                masked_card_number VARCHAR(19) NOT NULL,
                credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 50000,
                is_blocked BOOLEAN NOT NULL DEFAULT 0
            )
            """
        ))

    yield

    engine.dispose()

    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest.fixture(autouse=True)
def clean_tables():
    with engine.begin() as connection:
        for table in (
            "payments",
            "transactions_transaction",
            "fraud_fraudlog",
            "monitoring_apirequestlog",
            "cards_card",
        ):
            connection.execute(text(f"DELETE FROM {table}"))

        connection.execute(text(
            """
            INSERT INTO cards_card
                (id, user_id, masked_card_number, credit_limit, is_blocked)
            VALUES
                (:card, :user, '************1111', 50000, 0),
                (:blocked, :user, '************2222', 50000, 1)
            """
        ), {"card": CARD_ID, "blocked": BLOCKED_CARD_ID, "user": USER_ID})

    yield


@pytest.fixture(autouse=True)
def notifications(monkeypatch):
    """
    Captures notification calls instead of calling Django.
    """
    calls = {"transaction": [], "fraud": [], "credit_limit": []}

    from app.services import payment_service

    def fake_transaction_alert(user_id, amount):
        calls["transaction"].append((user_id, amount))
        return True

    def fake_fraud_alert(user_id, amount, reason):
        calls["fraud"].append((user_id, amount, reason))
        return True

    def fake_credit_alert(user_id, available_credit, credit_limit):
        calls["credit_limit"].append((user_id, available_credit, credit_limit))
        return True

    monkeypatch.setattr(payment_service, "send_transaction_alert", fake_transaction_alert)
    monkeypatch.setattr(payment_service, "send_fraud_alert", fake_fraud_alert)
    monkeypatch.setattr(payment_service, "send_credit_limit_alert", fake_credit_alert)

    return calls


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()
