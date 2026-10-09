
from sqlalchemy import BigInteger, Column, DateTime, Float, Integer, String, Text

from app.database import Base


class ApiRequestLog(Base):
    """
    Maps to the Django-owned table ``monitoring_apirequestlog``.
    FastAPI writes its own request metrics here with service="fastapi"
    so the admin dashboard can show both services together.
    """

    __tablename__ = "monitoring_apirequestlog"

    id = Column(Integer, primary_key=True, index=True)
    service = Column(String(20), nullable=False, default="fastapi")
    method = Column(String(10), nullable=False)
    path = Column(String(255), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Float, nullable=False)
    user_id = Column(BigInteger, nullable=True)
    error_message = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), nullable=False)
