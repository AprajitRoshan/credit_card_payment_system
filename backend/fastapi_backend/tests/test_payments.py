from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_create_payment():
    response = client.post(
        "/api/payments/?user_id=1",
        json={
            "amount": 500,
            "card_id": 7,
            "currency": "INR",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["amount"] == 500
    assert data["status"] == "PENDING"


def test_process_payment():
    create_response = client.post(
        "/api/payments/?user_id=1",
        json={
            "amount": 500,
            "card_id": 7,
            "currency": "INR",
        },
    )

    assert create_response.status_code == 201

    payment_id = create_response.json()["id"]

    response = client.post(
        f"/api/payments/{payment_id}/process"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] in ["SUCCESS", "FAILED"]