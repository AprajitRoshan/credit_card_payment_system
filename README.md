# Credit Card Payment System

A full-stack credit card payment management system built with **React + Tailwind CSS**, **Django REST Framework**, **FastAPI**, and **MySQL**.

## Features

- User registration and JWT authentication
- JWT access/refresh token handling and logout
- Protected API routes
- Add, view, and delete credit/debit cards
- Card-number masking and last-four-digit storage
- No CVV or full card number stored in the database
- FastAPI payment creation and processing
- Payment states: `PENDING`, `SUCCESS`, `FAILED`
- Transaction history
- Transaction filtering by status, amount, and date
- Django Admin management
- Admin dashboard with payment summary
- Admin transaction CSV export
- Admin action logging (audit log for card block/unblock, credit limit, fraud review, exports)
- Role-Based Access Control: Admin, Support, Read-Only, Customer
- Rule-based fraud detection with email alerts and a fraud review log
- Card usage analytics with line, bar and pie charts
- Analytics export to CSV and PDF
- Advanced transaction search with server-side pagination and sorting
- API response-time and error monitoring with a System Health dashboard
- React dashboard and application pages
- Django Swagger/OpenAPI documentation
- FastAPI Swagger documentation
- Postman API collection
- Automated tests
- FastAPI coverage verification
- Docker Compose deployment

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Axios, Recharts |
| Main Backend | Django 5.2, Django REST Framework |
| Payment API | FastAPI |
| Authentication | JWT / SimpleJWT |
| Database | MySQL 8 |
| API Documentation | drf-spectacular, FastAPI Swagger |
| Testing | Django TestCase, pytest, pytest-cov |
| Containerization | Docker, Docker Compose |

## Project Structure

```text
credit_card_payment_system/
├── backend/
│   ├── django_backend/
│   │   ├── accounts/          # users, roles, RBAC permissions, assign_role command
│   │   ├── cards/
│   │   ├── transactions/      # search, analytics, analytics export
│   │   ├── admin_panel/       # admin dashboard, card management, audit log
│   │   ├── fraud/             # fraud log model + review API
│   │   ├── monitoring/        # request logging middleware, health APIs
│   │   ├── notifications/     # email alerts (transaction, credit limit, fraud)
│   │   ├── statements/        # monthly PDF statement, cross-platform PDF fonts
│   │   ├── config/
│   │   ├── manage.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── fastapi_backend/
│       ├── app/
│       │   ├── middleware/    # API monitoring middleware
│       │   ├── models/
│       │   ├── routes/        # payments, dashboard, health
│       │   ├── schemas/
│       │   └── services/      # payment, fraud, notification services
│       ├── tests/
│       ├── Dockerfile
│       └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # admin panels, chart theme/tooltip
│   │   ├── pages/
│   │   ├── services/
│   │   └── assets/
│   └── Dockerfile
├── database/
│   └── credit_card_payment_db.sql
├── scripts/
│   └── e2e_test.py            # end-to-end test against running services
├── postman/
├── screenshots/
├── docker-compose.yml
└── README.md
```

## Main Application Pages

- Register
- Login
- Dashboard
- Cards
- Add Card
- Payment
- Transactions (advanced search, pagination, sorting)
- Analytics (charts + CSV/PDF export)
- Admin Dashboard (summary, system health, fraud review)
- Admin Card Management

## API Endpoints

### Authentication — Django

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register/` | Register user |
| POST | `/api/auth/login/` | Login and obtain JWT |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Get authenticated user |
| POST | `/api/auth/logout/` | Blacklist refresh token |

### Cards — Django

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/cards/` | List user's cards |
| POST | `/api/cards/` | Add a card |
| DELETE | `/api/cards/{id}/` | Delete a card |

The application accepts card details for processing but stores only the masked card number and last four digits. CVV and the complete card number are not stored.

### Payments — FastAPI

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/payments/?user_id={id}` | Create payment |
| POST | `/api/payments/{payment_id}/process` | Process/simulate payment |

A newly created payment starts as `PENDING` and processing results in `SUCCESS` or `FAILED`.

### Transactions — Django

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/transactions/` | List transactions (paginated) |
| GET | `/api/transactions/?status=SUCCESS` | Filter by status |
| GET | `/api/transactions/?min_amount=600&max_amount=800` | Filter by amount range |
| GET | `/api/transactions/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` | Filter by date range |
| GET | `/api/transactions/?card_number=1111` | Masked card search (accepts `1111`, `**** 1111`) |
| GET | `/api/transactions/?fraud_status=FLAGGED` | Filter by fraud status |
| GET | `/api/transactions/?page=2&limit=20&ordering=-amount` | Pagination and sorting (`created_at`, `amount`, `status`, `id`) |
| GET | `/api/transactions/analytics/?month=10&year=2026` | Monthly summary, categories, 6-month trend, utilization |
| GET | `/api/transactions/analytics/export/csv/?month=10&year=2026` | Analytics summary as CSV |
| GET | `/api/transactions/analytics/export/pdf/?month=10&year=2026` | Analytics summary as PDF |

### Admin APIs

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/api/admin/dashboard/` | Admin, Support, Read-Only | Payment/user/card summary |
| GET | `/api/admin/transactions/export/` | Admin | Export transactions as CSV |
| GET | `/api/admin/cards/` | Admin, Support, Read-Only | All cards with recent activity |
| PATCH | `/api/admin/cards/{id}/` | Admin (all), Support (block/unblock only) | Block/unblock card, update credit limit |
| GET | `/api/admin/system-health/?hours=24` | Admin, Support, Read-Only | Service status and API metrics |
| GET | `/api/fraud/logs/` | Admin, Support, Read-Only | Fraud log (filters: `review_status`, `rule`, `user_id`, `start_date`, `end_date`) |
| PATCH | `/api/fraud/logs/{id}/review/` | Admin, Support | Mark `CONFIRMED_FRAUD`, `FALSE_POSITIVE` or `OPEN` |

### Health

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health/` (Django) | Public liveness + database check |
| GET | `/health` (FastAPI) | Public liveness + database check |

## Roles and Permissions (RBAC)

Roles are seeded by migration `accounts/0004_seed_roles`. New registrations get the `CUSTOMER` role.

| Capability | Admin | Support | Read-Only | Customer |
|---|---|---|---|---|
| View admin dashboard, cards, system health, fraud logs | ✓ | ✓ | ✓ | — |
| Block / unblock cards | ✓ | ✓ | — | — |
| Update credit limits | ✓ | — | — | — |
| Review fraud cases | ✓ | ✓ | — | — |
| Export all transactions | ✓ | — | — | — |
| Own cards, payments, transactions, analytics | ✓ | ✓ | ✓ | ✓ |

Assign a role:

```powershell
python manage.py assign_role <username> ADMIN
```

Every admin action (block/unblock, credit-limit change, fraud review, exports) is written to the `AdminLog` audit table with old/new values and IP address.

## Fraud Detection

Fraud rules run in the FastAPI payment service (`app/services/fraud_service.py`) when a payment is processed. Rules look at the same user's payments inside a 10-minute window:

| Rule | Triggers when |
|---|---|
| `MULTIPLE_HIGH_VALUE_TRANSACTIONS` | 2+ payments above ₹5,000 in the window |
| `RAPID_REPEATED_TRANSACTIONS` | 3+ payments in the window |
| `DIFFERENT_DEVICE_IN_SHORT_WINDOW` | A recent payment used a different `device_id` |
| `DIFFERENT_LOCATION_IN_SHORT_WINDOW` | A recent payment came from a different `location_id` |

`HIGH_VALUE_TRANSACTION` is added as context when a flagged payment is above ₹5,000. A single high-value payment on its own is not fraud — it still sends the existing high-value alert email.

When a payment is flagged:

1. The transaction's `fraud_status` is set to `FLAGGED` and `fraud_reason` lists the rules.
2. A row is stored in `fraud_fraudlog` for review.
3. The customer receives a "Suspicious Payment Alert" email; `alert_sent` records whether it was delivered.
4. Admin/Support review the case from the Admin Dashboard.

The React Payment page sends a per-browser `device_id` and the browser time zone as `location_id`. Thresholds can be changed with `FRAUD_HIGH_VALUE_THRESHOLD`, `FRAUD_WINDOW_MINUTES`, `FRAUD_RAPID_COUNT` and `FRAUD_HIGH_VALUE_COUNT`.

Payments on blocked or unknown cards are rejected.

## Monitoring

- Django and FastAPI middleware record every API request (method, normalised path, status, response time, user, error message) in `monitoring_apirequestlog`.
- Each response carries an `X-Response-Time-ms` header.
- Server errors and slow requests (> `SLOW_REQUEST_THRESHOLD_MS`, default 1000 ms) are also written to `backend/django_backend/logs/api.log`.
- The Admin Dashboard System Health panel shows service status (Django, database, FastAPI), request count, average and P95 response time, error rate, requests per hour, slowest endpoints, recent errors and open fraud cases. It refreshes every 30 seconds.

## API Documentation

### Django Swagger

```text
http://127.0.0.1:8000/api/schema/swagger-ui/
```

OpenAPI schema:

```text
http://127.0.0.1:8000/api/schema/
```

### FastAPI Swagger

```text
http://127.0.0.1:8001/docs
```

## Database Schema

The main database entities are:

### Users

Stores application users and authentication information.

### Cards

Stores:

- User
- Card type
- Card holder name
- Masked card number
- Last four digits
- Expiry month/year
- Created timestamp

Full card numbers and CVV are not stored.

### Transactions

Stores:

- User
- Payment ID
- Card ID
- Amount
- Currency
- Status
- Created timestamp

Supported transaction statuses:

```text
PENDING
SUCCESS
FAILED
```

Fraud fields:

```text
fraud_status   CLEAR | FLAGGED
fraud_reason   comma-separated rule codes
category       SHOPPING | FOOD | TRAVEL | BILLS | ENTERTAINMENT | OTHER
```

### Roles

`ADMIN`, `SUPPORT`, `READ_ONLY`, `CUSTOMER` — linked to users through `accounts_user.role_id`.

### Admin Logs (audit)

Stores administrator actions with `details` (old/new values) and `ip_address`:

- `VIEW_DASHBOARD`, `VIEW_CARDS`
- `BLOCK_CARD`, `UNBLOCK_CARD`, `UPDATE_CREDIT_LIMIT`
- `REVIEW_FRAUD`
- `EXPORT_TRANSACTIONS`, `EXPORT_ANALYTICS`

### Fraud Logs

One row per flagged payment: user, transaction, payment, card, amount, rules triggered, device, location, `alert_sent`, review status, reviewer and notes.

### API Request Logs

Service (`django`/`fastapi`), method, path, status code, response time (ms), user and error message.

## Running Locally Without Docker

### Django

```powershell
cd backend\django_backend
venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

`migrate` adds the fraud fields, fraud log, monitoring tables and seeds the roles. If `fraud_status`/`fraud_reason` were already added to MySQL manually, the migration detects them and skips creating them again.

### FastAPI

```powershell
cd backend\fastapi_backend
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8001
```

FastAPI adds any missing `payments` columns (`device_id`, `location_id`, `category`) on startup.

### React

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Running With Docker

Docker Compose runs:

- MySQL
- Django
- FastAPI
- React

Build:

```powershell
docker compose build
```

Start:

```powershell
docker compose up -d
```

Check services:

```powershell
docker compose ps
```

Expected services:

```text
Django    8000
FastAPI   8001
Frontend  5173
MySQL     3307 -> 3306
```

Stop:

```powershell
docker compose down
```

## Testing

### Django (57 tests)

Covers authentication, cards, RBAC on every admin endpoint, audit logging, fraud log API and review, fraud alert email, transaction search/pagination/sorting, analytics, CSV/PDF export, monitoring middleware and health endpoints.

```powershell
cd backend\django_backend
python manage.py test
```

To run without MySQL:

```powershell
$env:DB_ENGINE="sqlite"; python manage.py test
```

### FastAPI (31 tests, 95% coverage)

Covers payment creation/processing, validation, blocked cards, every fraud rule, fraud log storage, alerts, monitoring middleware, health, JWT dashboard and schema sync. Tests use an isolated SQLite database and mocked emails.

```powershell
cd backend\fastapi_backend
pytest --cov=app
```

### End-to-end (39 checks)

`scripts/e2e_test.py` runs a full customer + admin journey against the running services: registration, cards, payments, all fraud rules, fraud logs and emails, search filters, analytics, exports, RBAC, card blocking and system health.

```powershell
python manage.py createsuperuser --username e2e_admin
python manage.py assign_role e2e_admin ADMIN

$env:E2E_ADMIN_PASSWORD="<password>"
python scripts\e2e_test.py
```

Tip: start Django with `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` so test alerts are printed instead of emailed.

## Security

The application includes:

- JWT authentication
- Refresh-token blacklisting on logout
- Password hashing through Django authentication
- Protected API routes
- Administrator-only APIs
- Input validation
- Django ORM/database parameterization
- No CVV storage
- No full card-number storage
- Masked card display
- Last-four-digit storage

## Postman

A Postman collection is included in the project:

```text
Credit_Card_Payment_System_Postman_Collection.json
```

It contains requests for:

- Authentication
- Cards
- Payments
- Transactions
- Admin APIs
- API documentation

## Database Backup

A MySQL database dump is included at:

```text
database/credit_card_payment_db.sql
```

## Screenshots

Project evidence screenshots are stored in:

```text
screenshots/
```

They cover application UI, authentication, cards, payments, administration, API documentation, database/security evidence, automated tests, coverage, and Docker.

## Important Configuration

For local development, configure database and application secrets through environment variables / `.env` files. Templates are provided in `backend/django_backend/.env.example` and `backend/fastapi_backend/.env.example`.

Do not commit real passwords, JWT secrets, or other credentials to GitHub.

## Docker Verification

The Docker Compose stack was successfully built and started with all four services running:

```text
credit_card_mysql       Healthy
credit_card_django      Up
credit_card_fastapi     Up
credit_card_frontend    Up
```

The React dashboard and FastAPI Swagger UI were verified through the Dockerized services.

## Project Submission Contents

The final project should contain:

- Source code
- React frontend
- Django backend
- FastAPI payment service
- Dockerfiles
- Docker Compose configuration
- MySQL database dump
- Postman collection
- API documentation
- Automated tests
- Screenshots
- README documentation
