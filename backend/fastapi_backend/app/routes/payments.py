from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.services.payment_service import (
    create_payment,
    process_payment,
)


router = APIRouter(
    tags=["Payments"],
)


@router.post(
    "/",
    response_model=PaymentResponse,
    status_code=201,
)
def make_payment(
    user_id: int,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
):
    return create_payment(
        db=db,
        payment_data=payment_data,
        user_id=user_id,
    )


@router.post(
    "/{payment_id}/process",
    response_model=PaymentResponse,
)
def process_payment_api(
    payment_id: int,
    db: Session = Depends(get_db),
):
    try:
        return process_payment(
            db=db,
            payment_id=payment_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )