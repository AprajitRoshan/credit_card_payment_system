
from sqlalchemy import Column, Integer, Float, String, DateTime, Text
from sqlalchemy.sql import func

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions_transaction"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    payment_id = Column(Integer, nullable=False)
    card_id = Column(Integer, nullable=False)

    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False)
    status = Column(String(20), nullable=False)

    # Required by the existing Django transactions table
    category = Column(
        String(20),
        nullable=False,
        default="OTHER",
        server_default="OTHER",
    )

    # Fraud detection
    fraud_status = Column(
        String(20),
        nullable=False,
        default="CLEAR",
        server_default="CLEAR",
    )
    fraud_reason = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
