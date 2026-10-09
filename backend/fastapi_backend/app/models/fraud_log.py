
from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text

from app.database import Base


class FraudLog(Base):
    """
    Maps to the Django-owned table ``fraud_fraudlog``.
    The table is created by Django migrations (fraud app).
    """

    __tablename__ = "fraud_fraudlog"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    transaction_id = Column(Integer, nullable=True)
    payment_id = Column(Integer, nullable=False)
    card_id = Column(Integer, nullable=False)

    amount = Column(Numeric(12, 2), nullable=False)
    rules_triggered = Column(String(255), nullable=False)

    device_id = Column(String(100), nullable=True)
    location_id = Column(String(100), nullable=True)

    alert_sent = Column(Boolean, nullable=False, default=False)

    review_status = Column(String(20), nullable=False, default="OPEN")
    reviewed_by_id = Column(Integer, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_notes = Column(Text, nullable=False, default="")

    created_at = Column(DateTime(timezone=True), nullable=False)
