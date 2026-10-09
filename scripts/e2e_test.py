"""
End-to-end test for the Credit Card Payment System.

Runs a full user + admin journey against the RUNNING services:

    Django  (default http://127.0.0.1:8000/api)
    FastAPI (default http://127.0.0.1:8001)

Prerequisites
-------------
1. Start Django and FastAPI.
2. Create an admin account with the ADMIN role:

       python manage.py createsuperuser --username e2e_admin
       python manage.py assign_role e2e_admin ADMIN

3. Run:

       set E2E_ADMIN_USERNAME=e2e_admin
       set E2E_ADMIN_PASSWORD=<password>
       python scripts/e2e_test.py

Tip: run Django with
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
so test alerts are printed instead of emailed.
"""

import os
import sys
import time
import uuid

import requests


DJANGO = os.getenv("E2E_DJANGO_URL", "http://127.0.0.1:8000/api").rstrip("/")
FASTAPI = os.getenv("E2E_FASTAPI_URL", "http://127.0.0.1:8001").rstrip("/")
ADMIN_USERNAME = os.getenv("E2E_ADMIN_USERNAME", "e2e_admin")
ADMIN_PASSWORD = os.getenv("E2E_ADMIN_PASSWORD", "AdminPass123!")

RESULTS = []


# ---------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------

def check(name, condition, detail=""):
    RESULTS.append((name, bool(condition)))
    mark = "PASS" if condition else "FAIL"
    suffix = f"  ({detail})" if detail and not condition else ""
    print(f"  [{mark}] {name}{suffix}")
    return condition


def section(title):
    print(f"\n== {title}")


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def login(username, password):
    response = requests.post(
        f"{DJANGO}/auth/login/",
        json={"username": username, "password": password},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()["access"]


def pay(user_id, card_id, amount, device_id=None, location_id=None, category="OTHER"):
    created = requests.post(
        f"{FASTAPI}/api/payments/?user_id={user_id}",
        json={
            "card_id": card_id,
            "amount": amount,
            "category": category,
            "device_id": device_id,
            "location_id": location_id,
        },
        timeout=10,
    )

    if created.status_code != 201:
        return created, None

    processed = requests.post(
        f"{FASTAPI}/api/payments/{created.json()['id']}/process",
        timeout=15,
    )

    return created, processed


# ---------------------------------------------------------------------
# JOURNEY
# ---------------------------------------------------------------------

def main():
    suffix = uuid.uuid4().hex[:6]
    username = f"e2e_user_{suffix}"
    password = "E2ePassword123!"
    device = f"e2e-device-{suffix}"

    section("Health")
    django_health = requests.get(f"{DJANGO}/health/", timeout=5)
    check("Django /api/health/ returns ok", django_health.json().get("status") == "ok")

    fastapi_health = requests.get(f"{FASTAPI}/health", timeout=5)
    check("FastAPI /health returns ok", fastapi_health.json().get("status") == "ok")

    section("Customer registration and cards")
    registered = requests.post(
        f"{DJANGO}/auth/register/",
        json={"username": username, "email": f"{username}@example.com", "password": password},
        timeout=10,
    )
    check("Register customer", registered.status_code == 201, registered.text)

    token = login(username, password)
    me = requests.get(f"{DJANGO}/auth/me/", headers=auth(token), timeout=10).json()
    check("New user has CUSTOMER role", me.get("role") == "CUSTOMER", me)
    user_id = me["id"]

    card = requests.post(
        f"{DJANGO}/cards/",
        headers=auth(token),
        json={
            "card_type": "CREDIT",
            "card_holder_name": "E2E User",
            "card_number": "4111111111114242",
            "expiry_month": 12,
            "expiry_year": 2030,
            "cvv": "123",
        },
        timeout=10,
    )
    check("Add card", card.status_code == 201, card.text)
    card_id = card.json()["id"]
    check("Card stored masked", card.json()["masked_card_number"].endswith("4242")
          and "4111111111114242" not in card.json()["masked_card_number"])

    section("Payments and fraud detection")
    _, normal = pay(user_id, card_id, 450, device, "Asia/Kolkata", "FOOD")
    check("Normal payment processed", normal.status_code == 200, normal.text)
    check("Normal payment is CLEAR", normal.json()["fraud_status"] == "CLEAR")

    # Wait out the fraud window is not possible in a test, so use a new
    # user for each rule to keep the checks independent.
    _, high_1 = pay(user_id, card_id, 6000, device, "Asia/Kolkata", "TRAVEL")
    check("First high-value payment processed", high_1.status_code == 200)

    # This is the 3rd payment in the window -> rapid + multiple high value
    _, high_2 = pay(user_id, card_id, 7500, device, "Asia/Kolkata", "SHOPPING")
    reasons = high_2.json().get("fraud_reasons", [])
    check("Second high-value payment FLAGGED", high_2.json()["fraud_status"] == "FLAGGED", reasons)
    check("Rule: MULTIPLE_HIGH_VALUE_TRANSACTIONS", "MULTIPLE_HIGH_VALUE_TRANSACTIONS" in reasons, reasons)
    check("Rule: RAPID_REPEATED_TRANSACTIONS", "RAPID_REPEATED_TRANSACTIONS" in reasons, reasons)

    _, other_device = pay(user_id, card_id, 100, f"other-{suffix}", "Europe/London")
    reasons = other_device.json().get("fraud_reasons", [])
    check("Rule: DIFFERENT_DEVICE_IN_SHORT_WINDOW", "DIFFERENT_DEVICE_IN_SHORT_WINDOW" in reasons, reasons)
    check("Rule: DIFFERENT_LOCATION_IN_SHORT_WINDOW", "DIFFERENT_LOCATION_IN_SHORT_WINDOW" in reasons, reasons)

    reprocess = requests.post(f"{FASTAPI}/api/payments/{high_2.json()['id']}/process", timeout=10)
    check("Re-processing a payment is rejected (400)", reprocess.status_code == 400)

    unknown_card, _ = pay(user_id, 999999, 100)
    check("Payment with unknown card rejected (404)", unknown_card.status_code == 404)

    section("Transaction search")
    listing = requests.get(f"{DJANGO}/transactions/", headers=auth(token), params={"limit": 2}, timeout=10).json()
    check("Paginated list (count=4, 2 per page)", listing["count"] == 4 and len(listing["results"]) == 2, listing.get("count"))

    flagged = requests.get(f"{DJANGO}/transactions/", headers=auth(token), params={"fraud_status": "FLAGGED"}, timeout=10).json()
    check("Filter fraud_status=FLAGGED", flagged["count"] >= 2, flagged["count"])

    amount = requests.get(f"{DJANGO}/transactions/", headers=auth(token), params={"min_amount": 5000, "max_amount": 8000}, timeout=10).json()
    check("Amount range filter", amount["count"] == 2, amount["count"])

    by_card = requests.get(f"{DJANGO}/transactions/", headers=auth(token), params={"card_number": "**** 4242"}, timeout=10).json()
    check("Masked card search", by_card["count"] == 4, by_card["count"])

    sorted_desc = requests.get(f"{DJANGO}/transactions/", headers=auth(token), params={"ordering": "-amount"}, timeout=10).json()
    amounts = [float(t["amount"]) for t in sorted_desc["results"]]
    check("Server-side sorting by amount", amounts == sorted(amounts, reverse=True), amounts)

    bad = requests.get(f"{DJANGO}/transactions/", headers=auth(token), params={"start_date": "2026-13-40"}, timeout=10)
    check("Invalid date returns 400 (not 500)", bad.status_code == 400, bad.status_code)

    section("Analytics and exports")
    analytics = requests.get(f"{DJANGO}/transactions/analytics/", headers=auth(token), timeout=10).json()
    check("Analytics has 6-month trend", len(analytics.get("monthly_trend", [])) == 6)
    check("Analytics counts flagged", analytics["transaction_counts"]["flagged"] >= 2)

    csv_export = requests.get(f"{DJANGO}/transactions/analytics/export/csv/", headers=auth(token), timeout=10)
    check("CSV export", csv_export.status_code == 200 and "Monthly Spending" in csv_export.text)

    pdf_export = requests.get(f"{DJANGO}/transactions/analytics/export/pdf/", headers=auth(token), timeout=20)
    check("PDF export", pdf_export.status_code == 200 and pdf_export.content.startswith(b"%PDF"))

    dashboard = requests.get(f"{FASTAPI}/api/dashboard/summary", headers=auth(token), timeout=10)
    check("FastAPI dashboard summary with JWT", dashboard.status_code == 200 and dashboard.json()["total_transactions"] == 4, dashboard.text[:200])

    section("RBAC")
    check("Customer blocked from admin dashboard",
          requests.get(f"{DJANGO}/admin/dashboard/", headers=auth(token), timeout=10).status_code == 403)
    check("Customer blocked from system health",
          requests.get(f"{DJANGO}/admin/system-health/", headers=auth(token), timeout=10).status_code == 403)
    check("Customer blocked from fraud logs",
          requests.get(f"{DJANGO}/fraud/logs/", headers=auth(token), timeout=10).status_code == 403)

    section("Admin: fraud review, card block, monitoring")
    admin_token = login(ADMIN_USERNAME, ADMIN_PASSWORD)

    logs = requests.get(f"{DJANGO}/fraud/logs/", headers=auth(admin_token),
                        params={"user_id": user_id, "review_status": "OPEN"}, timeout=10).json()
    check("Fraud logs stored for flagged payments", logs["count"] >= 2, logs.get("count"))
    check("Fraud alert email recorded as sent", all(item["alert_sent"] for item in logs["results"]))

    reviewed = requests.patch(
        f"{DJANGO}/fraud/logs/{logs['results'][0]['id']}/review/",
        headers=auth(admin_token),
        json={"review_status": "CONFIRMED_FRAUD", "review_notes": "E2E"},
        timeout=10,
    )
    check("Admin reviews fraud case", reviewed.status_code == 200 and reviewed.json()["review_status"] == "CONFIRMED_FRAUD")

    blocked = requests.patch(f"{DJANGO}/admin/cards/{card_id}/", headers=auth(admin_token), json={"is_blocked": True}, timeout=15)
    check("Admin blocks card", blocked.status_code == 200 and blocked.json()["is_blocked"] is True)

    blocked_payment, _ = pay(user_id, card_id, 100)
    check("Payment on blocked card rejected (400)", blocked_payment.status_code == 400, blocked_payment.text)

    time.sleep(0.5)
    health = requests.get(f"{DJANGO}/admin/system-health/", headers=auth(admin_token), timeout=10).json()
    services = {row["service"] for row in health["per_service"]}
    check("System health reports overall status", health["status"] in {"healthy", "degraded", "down"})
    check("FastAPI reachable from Django health check", health["services"]["fastapi"]["status"] == "up", health["services"]["fastapi"])
    check("Response times logged for both services", {"django", "fastapi"} <= services, services)
    check("Open fraud cases counted", health["fraud"]["open_cases"] >= 1)

    # -----------------------------------------------------------------
    passed = sum(1 for _, ok in RESULTS if ok)
    print(f"\n{passed}/{len(RESULTS)} checks passed")

    return 0 if passed == len(RESULTS) else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except requests.RequestException as exc:
        print(f"\nCould not reach a service: {exc}")
        sys.exit(2)
