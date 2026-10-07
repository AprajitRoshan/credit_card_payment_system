from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import payments, dashboard

app = FastAPI(
    title="Credit Card Payment System - Payment API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    payments.router,
    prefix="/api/payments",
    tags=["Payments"],
)

app.include_router(
    dashboard.router,
    prefix="/api",
)