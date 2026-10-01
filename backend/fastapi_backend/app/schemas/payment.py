from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    card_id: int
    amount: float = Field(gt=0)
    currency: str = "INR"


class PaymentResponse(BaseModel):
    id: int
    user_id: int
    card_id: int
    amount: float
    currency: str
    status: str

    class Config:
        from_attributes = True