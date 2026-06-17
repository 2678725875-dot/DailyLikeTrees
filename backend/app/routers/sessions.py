"""Focus session API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.focus_session import SessionCreate, SessionCompleteResponse, SessionResponse
from ..services import session_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionCompleteResponse, status_code=201)
def complete_session(data: SessionCreate, db: Session = Depends(get_db)):
    """Complete a focus session → plant a tree."""
    result = session_service.create_session(db, data.model_dump())
    return result


@router.get("")
def list_sessions(limit: int = 20, offset: int = 0, db: Session = Depends(get_db)):
    """List recent focus sessions."""
    return session_service.get_sessions(db, limit, offset)
