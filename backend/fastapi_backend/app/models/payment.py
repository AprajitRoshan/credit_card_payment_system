
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    card_id = Column(Integer, nullable=False)

    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(String(20), default="PENDING", nullable=False)

    category = Column(
        String(20),
        default="OTHER",
        server_default="OTHER",
        nullable=False,
    )

    # Used by the fraud rules (different device / location)
    device_id = Column(String(100), nullable=True)
    location_id = Column(String(100), nullable=True)

    # Timestamps are written in UTC from Python so that the fraud
    # time-window comparison does not depend on the MySQL server
    # timezone.
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
