from fastapi.testclient import TestClient

from app.main import app
from app.middleware.monitoring import normalize_path
from app.models.api_request_log import ApiRequestLog
from tests.conftest import CARD_ID, USER_ID


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["database"] == "up"


def test_health_is_not_logged(db):
    client.get("/health")

    assert db.query(ApiRequestLog).count() == 0


def test_requests_are_logged_with_response_time(db):
    response = client.post(
        f"/api/payments/?user_id={USER_ID}",
        json={"amount": 100, "card_id": CARD_ID},
    )

    assert "x-response-time-ms" in response.headers

    log = db.query(ApiRequestLog).one()
    assert log.service == "fastapi"
    assert log.method == "POST"
    assert log.path == "/api/payments/"
    assert log.status_code == 201
    assert log.user_id == USER_ID
    assert log.response_time_ms >= 0


def test_error_status_logged_with_normalized_path(db):
    client.post("/api/payments/12345/process")

    log = db.query(ApiRequestLog).one()
    assert log.path == "/api/payments/{id}/process"
    assert log.status_code == 404


def test_normalize_path():
    assert normalize_path("/api/payments/9/process") == "/api/payments/{id}/process"
