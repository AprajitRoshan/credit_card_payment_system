"""
Keeps the FastAPI-owned ``payments`` table in sync with the model.

The payments table has no migration tool, and older databases were
created before device_id, location_id and category were added. On
startup we create the table if it is missing and add any missing
columns. Django-owned tables are never touched here.
"""

import logging

from sqlalchemy import inspect, text

from app.models.payment import Payment


logger = logging.getLogger("payment_api.schema")

PAYMENT_COLUMNS = {
    "device_id": "VARCHAR(100) NULL",
    "location_id": "VARCHAR(100) NULL",
    "category": "VARCHAR(20) NOT NULL DEFAULT 'OTHER'",
}


def sync_payment_schema(engine):
    try:
        Payment.__table__.create(bind=engine, checkfirst=True)

        existing = {
            column["name"]
            for column in inspect(engine).get_columns("payments")
        }

        with engine.begin() as connection:
            for name, ddl in PAYMENT_COLUMNS.items():
                if name not in existing:
                    connection.execute(
                        text(f"ALTER TABLE payments ADD COLUMN {name} {ddl}")
                    )
                    logger.info("Added payments.%s column.", name)
    except Exception:
        logger.exception("Could not sync the payments table schema.")
