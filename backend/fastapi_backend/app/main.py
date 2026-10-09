import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.middleware.monitoring import ApiMonitoringMiddleware
from app.routes import payments, dashboard, health
from app.schema_sync import sync_payment_schema


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    sync_payment_schema(engine)
    yield


app = FastAPI(
    title="Credit Card Payment System - Payment API",
    lifespan=lifespan,
)

app.add_middleware(ApiMonitoringMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Response-Time-ms"],
)

app.include_router(health.router)

app.include_router(
    payments.router,
    prefix="/api/payments",
    tags=["Payments"],
)

app.include_router(
    dashboard.router,
    prefix="/api",
)
