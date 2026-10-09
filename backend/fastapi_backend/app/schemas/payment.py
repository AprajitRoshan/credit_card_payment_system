
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


PaymentCategory = Literal[
    "SHOPPING",
    "FOOD",
    "TRAVEL",
    "BILLS",
    "ENTERTAINMENT",
    "OTHER",
]


class PaymentCreate(BaseModel):
    card_id: int
    amount: float = Field(gt=0, le=10_000_000)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    category: PaymentCategory = "OTHER"

    device_id: str | None = Field(default=None, max_length=100)
    location_id: str | None = Field(default=None, max_length=100)


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    card_id: int
    amount: float
    currency: str
    status: str
    category: str | None = "OTHER"

    # Only populated by the process endpoint.
    fraud_status: str | None = None
    fraud_reasons: list[str] = []
