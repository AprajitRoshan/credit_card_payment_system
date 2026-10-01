from sqlalchemy import Column, Integer, Float, String, DateTime
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
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )