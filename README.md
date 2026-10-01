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
- Admin action logging
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
| Frontend | React, Vite, Tailwind CSS, Axios |
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
│   │   ├── authentication/
│   │   ├── cards/
│   │   ├── transactions/
│   │   ├── admin_panel/
│   │   ├── credit_card_system/
│   │   ├── manage.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── fastapi_backend/
│       ├── app/
│       │   ├── routes/
│       │   ├── schemas/
│       │   └── services/
│       ├── tests/
│       ├── Dockerfile
│       └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── assets/
│   └── Dockerfile
├── database/
│   └── credit_card_payment_db.sql
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
- Transactions
- Admin Dashboard

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
| GET | `/api/transactions/` | List transactions |
| GET | `/api/transactions/?status=SUCCESS` | Filter by status |
| GET | `/api/transactions/?min_amount=600&max_amount=800` | Filter by amount |
| GET | `/api/transactions/?date=YYYY-MM-DD` | Filter by date |

### Admin APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/dashboard/` | Admin payment/user/card summary |
| GET | `/api/admin/transactions/export/` | Export transactions as CSV |

Admin APIs require administrator authentication.

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

### Admin Logs

Stores administrator actions such as:

- `VIEW_DASHBOARD`
- `EXPORT_TRANSACTIONS`

## Running Locally Without Docker

### Django

```powershell
cd backend\django_backend
venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver 8000
```

### FastAPI

```powershell
cd backend\fastapi_backend
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8001
```

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

Django authentication tests were executed successfully:

```text
4 tests passed
```

Django card tests were executed successfully:

```text
4 tests passed
```

FastAPI payment tests:

```text
2 passed
```

FastAPI coverage verification reached:

```text
96%
```

The FastAPI test suite covers payment creation and payment processing.

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

For local development, configure database and application secrets through environment variables / `.env` files.

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
