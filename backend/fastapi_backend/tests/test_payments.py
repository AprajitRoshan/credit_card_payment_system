from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import BLOCKED_CARD_ID, CARD_ID, USER_ID


client = TestClient(app)


def create(amount=500, card_id=CARD_ID, **extra):
    return client.post(
        f"/api/payments/?user_id={USER_ID}",
        json={
            "amount": amount,
            "card_id": card_id,
            "currency": "INR",
            **extra,
        },
    )


def test_create_payment():
    response = create(500)

    assert response.status_code == 201

    data = response.json()

    assert data["amount"] == 500
    assert data["status"] == "PENDING"
    assert data["category"] == "OTHER"


def test_process_payment():
    create_response = create(500)

    assert create_response.status_code == 201

    payment_id = create_response.json()["id"]

    response = client.post(f"/api/payments/{payment_id}/process")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] in ["SUCCESS", "FAILED"]
    assert data["fraud_status"] == "CLEAR"


def test_invalid_amount_rejected():
    assert create(0).status_code == 422
    assert create(-100).status_code == 422


def test_invalid_category_rejected():
    assert create(100, category="CASINO").status_code == 422


def test_unknown_card_rejected():
    response = create(100, card_id=999)

    assert response.status_code == 404
    assert response.json()["detail"] == "Card not found for this user."


def test_blocked_card_rejected():
    response = create(100, card_id=BLOCKED_CARD_ID)

    assert response.status_code == 400
    assert "blocked" in response.json()["detail"]


def test_process_unknown_payment():
    assert client.post("/api/payments/99999/process").status_code == 404


def test_process_twice_rejected():
    payment_id = create(100).json()["id"]

    assert client.post(f"/api/payments/{payment_id}/process").status_code == 200

    response = client.post(f"/api/payments/{payment_id}/process")

    assert response.status_code == 400
    assert response.json()["detail"] == "Payment has already been processed."


def test_category_is_saved_on_transaction(db):
    from app.models.transaction import Transaction

    payment_id = create(250, category="FOOD").json()["id"]
    client.post(f"/api/payments/{payment_id}/process")

    transaction = db.query(Transaction).filter_by(payment_id=payment_id).one()

    assert transaction.category == "FOOD"
