from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db


router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Liveness + database check. Used by Docker and by the Django
    system-health endpoint shown on the admin dashboard.
    """
    try:
        db.execute(text("SELECT 1"))
        database = "up"
    except Exception:
        database = "down"

    healthy = database == "up"

    return JSONResponse(
        status_code=200 if healthy else 503,
        content={
            "status": "ok" if healthy else "error",
            "service": "fastapi",
            "database": database,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
